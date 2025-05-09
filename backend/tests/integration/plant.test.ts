import request from 'supertest';
import { app } from '../../src/app';
import { Plant } from '../../src/models/Plant';
import { DatabaseContext } from '../../src/config/database-context';
import { Repository } from 'typeorm';
import { beforeEach, describe, it, expect } from '@jest/globals';

describe('Plant Controller Integration Tests', () => {
    let plantRepository: Repository<Plant>;

    beforeEach(async () => {
        // Get the repository
        plantRepository = DatabaseContext.getInstance().getRepository(Plant);

        // Clear the plants table before each test
        await plantRepository.clear();
    });

    describe('GET /plants', () => {
        it('should return all plants', async () => {
            // Create test plants
            const testPlants = [
                plantRepository.create({ name: 'Test Plant 1', address: 'Location 1' }),
                plantRepository.create({ name: 'Test Plant 2', address: 'Location 2' })
            ];
            await plantRepository.save(testPlants);

            // Make request to get all plants
            const response = await request(app)
                .get('/plants')
                .expect(200);

            // Assertions
            expect(response.body).toHaveLength(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Test Plant 1',
                        address: 'Location 1'
                    }),
                    expect.objectContaining({
                        name: 'Test Plant 2',
                        address: 'Location 2'
                    })
                ])
            );
        });

        it('should return an empty array when no plants exist', async () => {
            const response = await request(app)
                .get('/plants')
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });

    describe('GET /plants/:id', () => {
        it('should return a specific plant by ID', async () => {
            const plant = await plantRepository.save(
                plantRepository.create({ name: 'Test Plant', address: 'Test Address' })
            );

            const response = await request(app)
                .get(`/plants/${plant.id}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: plant.id,
                    name: 'Test Plant',
                    address: 'Test Address'
                })
            );
        });

        it('should return 404 when plant ID does not exist', async () => {
            await request(app)
                .get('/plants/nonexistent-id')
                .expect(404);
        });
    });

    describe('POST /plants', () => {
        it('should create a new plant with valid data', async () => {
            const newPlant = {
                name: 'New Plant',
                address: 'New Address'
            };

            const response = await request(app)
                .post('/plants')
                .send(newPlant)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    name: newPlant.name,
                    address: newPlant.address
                })
            );

            // Verify plant was actually created in database
            const savedPlant = await plantRepository.findOne({ where: { id: response.body.id } });
            expect(savedPlant).toBeTruthy();
            expect(savedPlant?.name).toBe(newPlant.name);
        });

        it('should reject plant creation with missing required fields', async () => {
            const invalidPlant = {
                address: 'Missing Name'
            };

            await request(app)
                .post('/plants')
                .send(invalidPlant)
                .expect(400);
        });
    });

    describe('PUT /plants/:id', () => {
        it('should update an existing plant', async () => {
            const plant = await plantRepository.save(
                plantRepository.create({ name: 'Original Name', address: 'Original Address' })
            );

            const updateData = {
                name: 'Updated Name',
                address: 'Updated Address'
            };

            const response = await request(app)
                .put(`/plants/${plant.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: plant.id,
                    name: updateData.name,
                    address: updateData.address
                })
            );

            // Verify update in database
            const updatedPlant = await plantRepository.findOne({ where: { id: plant.id } });
            expect(updatedPlant?.name).toBe(updateData.name);
        });

        it('should return 404 when updating non-existent plant', async () => {
            await request(app)
                .put('/plants/nonexistent-id')
                .send({ name: 'New Name' })
                .expect(404);
        });

        it('should handle partial updates', async () => {
            const plant = await plantRepository.save(
                plantRepository.create({ name: 'Original Name', address: 'Original Address' })
            );

            const response = await request(app)
                .put(`/plants/${plant.id}`)
                .send({ name: 'Updated Name' })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    name: 'Updated Name',
                    address: 'Original Address'
                })
            );
        });
    });

    describe('DELETE /plants/:id', () => {
        it('should delete an existing plant', async () => {
            const plant = await plantRepository.save(
                plantRepository.create({ name: 'To Delete', address: 'Delete Address' })
            );

            await request(app)
                .delete(`/plants/${plant.id}`)
                .expect(204);

            // Verify plant was deleted
            const deletedPlant = await plantRepository.findOne({ where: { id: plant.id } });
            expect(deletedPlant).toBeNull();
        });

        it('should return 404 when deleting non-existent plant', async () => {
            await request(app)
                .delete('/plants/nonexistent-id')
                .expect(404);
        });
    });
}); 