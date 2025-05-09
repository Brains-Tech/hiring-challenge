import request from 'supertest';
import { app } from '../../src/app';
import { Area } from '../../src/models/Area';
import { Plant } from '../../src/models/Plant';
import { DatabaseContext } from '../../src/config/database-context';
import { Repository } from 'typeorm';
import { beforeEach, describe, it, expect } from '@jest/globals';

describe('Area Controller Integration Tests', () => {
    let areaRepository: Repository<Area>;
    let plantRepository: Repository<Plant>;
    let testPlant: Plant;

    beforeEach(async () => {
        areaRepository = DatabaseContext.getInstance().getRepository(Area);
        plantRepository = DatabaseContext.getInstance().getRepository(Plant);

        // Clear the areas table before each test
        await areaRepository.clear();
        await plantRepository.clear();

        // Create a test plant for area associations
        testPlant = await plantRepository.save(
            plantRepository.create({
                name: 'Test Plant',
                address: 'Test Address'
            })
        );
    });

    describe('GET /areas', () => {
        it('should return all areas', async () => {
            // Create test areas
            const testAreas = [
                areaRepository.create({
                    name: 'Test Area 1',
                    locationDescription: 'Location 1',
                    plantId: testPlant.id
                }),
                areaRepository.create({
                    name: 'Test Area 2',
                    locationDescription: 'Location 2',
                    plantId: testPlant.id
                })
            ];
            await areaRepository.save(testAreas);

            const response = await request(app)
                .get('/areas')
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Test Area 1',
                        locationDescription: 'Location 1',
                        plantId: testPlant.id
                    }),
                    expect.objectContaining({
                        name: 'Test Area 2',
                        locationDescription: 'Location 2',
                        plantId: testPlant.id
                    })
                ])
            );
        });

        it('should return an empty array when no areas exist', async () => {
            const response = await request(app)
                .get('/areas')
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });

    describe('GET /areas/:id', () => {
        it('should return a specific area by ID', async () => {
            const area = await areaRepository.save(
                areaRepository.create({
                    name: 'Test Area',
                    locationDescription: 'Test Location',
                    plantId: testPlant.id
                })
            );

            const response = await request(app)
                .get(`/areas/${area.id}`)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: area.id,
                    name: 'Test Area',
                    locationDescription: 'Test Location',
                    plantId: testPlant.id
                })
            );
        });

        it('should return 404 when area ID does not exist', async () => {
            await request(app)
                .get('/areas/nonexistent-id')
                .expect(404);
        });
    });

    describe('POST /areas', () => {
        it('should create a new area with valid data', async () => {
            const newArea = {
                name: 'New Area',
                locationDescription: 'New Location',
                plantId: testPlant.id
            };

            const response = await request(app)
                .post('/areas')
                .send(newArea)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    name: newArea.name,
                    locationDescription: newArea.locationDescription,
                    plantId: newArea.plantId
                })
            );

            // Verify area was created in database
            const savedArea = await areaRepository.findOne({ where: { id: response.body.id } });
            expect(savedArea).toBeTruthy();
            expect(savedArea?.name).toBe(newArea.name);
        });

        it('should reject area creation with missing required fields', async () => {
            const invalidArea = {
                locationDescription: 'Missing Name'
            };

            await request(app)
                .post('/areas')
                .send(invalidArea)
                .expect(400);
        });

        it('should reject area creation with non-existent plant ID', async () => {
            const invalidArea = {
                name: 'Test Area',
                locationDescription: 'Test Location',
                plantId: 'nonexistent-id'
            };

            await request(app)
                .post('/areas')
                .send(invalidArea)
                .expect(400);
        });
    });

    describe('PUT /areas/:id', () => {
        it('should update an existing area', async () => {
            const area = await areaRepository.save(
                areaRepository.create({
                    name: 'Original Name',
                    locationDescription: 'Original Location',
                    plantId: testPlant.id
                })
            );

            const updateData = {
                name: 'Updated Name',
                locationDescription: 'Updated Location'
            };

            const response = await request(app)
                .put(`/areas/${area.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: area.id,
                    name: updateData.name,
                    locationDescription: updateData.locationDescription,
                    plantId: testPlant.id
                })
            );

            // Verify update in database
            const updatedArea = await areaRepository.findOne({ where: { id: area.id } });
            expect(updatedArea?.name).toBe(updateData.name);
        });

        it('should return 404 when updating non-existent area', async () => {
            await request(app)
                .put('/areas/nonexistent-id')
                .send({ name: 'New Name' })
                .expect(404);
        });

        it('should handle partial updates', async () => {
            const area = await areaRepository.save(
                areaRepository.create({
                    name: 'Original Name',
                    locationDescription: 'Original Location',
                    plantId: testPlant.id
                })
            );

            const response = await request(app)
                .put(`/areas/${area.id}`)
                .send({ name: 'Updated Name' })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    name: 'Updated Name',
                    locationDescription: 'Original Location'
                })
            );
        });
    });

    describe('DELETE /areas/:id', () => {
        it('should delete an existing area', async () => {
            const area = await areaRepository.save(
                areaRepository.create({
                    name: 'To Delete',
                    locationDescription: 'Delete Location',
                    plantId: testPlant.id
                })
            );

            await request(app)
                .delete(`/areas/${area.id}`)
                .expect(204);

            // Verify area was deleted
            const deletedArea = await areaRepository.findOne({ where: { id: area.id } });
            expect(deletedArea).toBeNull();
        });

        it('should return 404 when deleting non-existent area', async () => {
            await request(app)
                .delete('/areas/nonexistent-id')
                .expect(404);
        });
    });
}); 