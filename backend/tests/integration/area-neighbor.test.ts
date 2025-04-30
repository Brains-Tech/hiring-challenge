// tests/integration/area-neighbors.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { Area } from '../../src/models/Area';
import { Plant } from '../../src/models/Plant';
import { AreaNeighbor } from '../../src/models/AreaNeighbor';
import { DatabaseContext } from '../../src/config/database-context';
import { Repository } from 'typeorm';
import { beforeEach, describe, it, expect } from '@jest/globals';

describe('Area Neighbors Integration Tests', () => {
  let areaRepository: Repository<Area>;
  let plantRepository: Repository<Plant>;
  let areaNeighborRepository: Repository<AreaNeighbor>;
  let testAreas: Area[];
  let testPlant: Plant;

  beforeEach(async () => {
    areaRepository = DatabaseContext.getInstance().getRepository(Area);
    plantRepository = DatabaseContext.getInstance().getRepository(Plant);
    areaNeighborRepository = DatabaseContext.getInstance().getRepository(AreaNeighbor);
    
    // Clear the tables before each test
    await areaNeighborRepository.clear();
    await areaRepository.clear();
    await plantRepository.clear();

    // Create a test plant
    testPlant = await plantRepository.save(
      plantRepository.create({
        name: 'Test Plant',
        address: 'Test Address'
      })
    );

    // Create test areas
    testAreas = await areaRepository.save([
      areaRepository.create({
        name: 'Area 1',
        locationDescription: 'Location 1',
        plantId: testPlant.id
      }),
      areaRepository.create({
        name: 'Area 2',
        locationDescription: 'Location 2',
        plantId: testPlant.id
      }),
      areaRepository.create({
        name: 'Area 3',
        locationDescription: 'Location 3',
        plantId: testPlant.id
      })
    ]);
  });

  describe('GET /areas/{areaId}/neighbors', () => {
    it('should return an empty array when area has no neighbors', async () => {
      const response = await request(app)
        .get(`/areas/${testAreas[0].id}/neighbors`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all neighbors of an area', async () => {
      // Create neighbor relationships
      await areaNeighborRepository.save([
        { areaId: testAreas[0].id, neighborId: testAreas[1].id },
        { areaId: testAreas[1].id, neighborId: testAreas[0].id },
        { areaId: testAreas[0].id, neighborId: testAreas[2].id },
        { areaId: testAreas[2].id, neighborId: testAreas[0].id }
      ]);

      const response = await request(app)
        .get(`/areas/${testAreas[0].id}/neighbors`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: testAreas[1].id }),
          expect.objectContaining({ id: testAreas[2].id })
        ])
      );
    });

    it('should return 404 for non-existent area', async () => {
      await request(app)
        .get('/areas/non-existent-id/neighbors')
        .expect(404);
    });
  });

  describe('POST /areas/{areaId}/neighbors', () => {
    it('should create a neighbor relationship', async () => {
      const response = await request(app)
        .post(`/areas/${testAreas[0].id}/neighbors`)
        .send({
          neighborId: testAreas[1].id,
          connectionType: 'door',
          notes: 'Test connection'
        })
        .expect(201);

      // Verify both directions of the relationship were created
      const relation1 = await areaNeighborRepository.findOne({
        where: { areaId: testAreas[0].id, neighborId: testAreas[1].id }
      });
      const relation2 = await areaNeighborRepository.findOne({
        where: { areaId: testAreas[1].id, neighborId: testAreas[0].id }
      });

      expect(relation1).toBeTruthy();
      expect(relation2).toBeTruthy();
      expect(relation1?.connectionType).toBe('door');
      expect(relation2?.connectionType).toBe('door');
    });

    it('should return 400 when trying to make an area neighbor of itself', async () => {
      await request(app)
        .post(`/areas/${testAreas[0].id}/neighbors`)
        .send({ neighborId: testAreas[0].id })
        .expect(400);
    });

    it('should return 400 when the neighbor area does not exist', async () => {
      await request(app)
        .post(`/areas/${testAreas[0].id}/neighbors`)
        .send({ neighborId: 'non-existent-id' })
        .expect(400);
    });

    it('should return 400 when the relationship already exists', async () => {
      // Create the relationship first
      await areaNeighborRepository.save([
        { areaId: testAreas[0].id, neighborId: testAreas[1].id },
        { areaId: testAreas[1].id, neighborId: testAreas[0].id }
      ]);

      await request(app)
        .post(`/areas/${testAreas[0].id}/neighbors`)
        .send({ neighborId: testAreas[1].id })
        .expect(400);
    });
  });

  describe('DELETE /areas/{areaId}/neighbors/{neighborId}', () => {
    it('should delete a neighbor relationship', async () => {
      // Create the relationship first
      await areaNeighborRepository.save([
        { areaId: testAreas[0].id, neighborId: testAreas[1].id },
        { areaId: testAreas[1].id, neighborId: testAreas[0].id }
      ]);

      await request(app)
        .delete(`/areas/${testAreas[0].id}/neighbors/${testAreas[1].id}`)
        .expect(204);

      // Verify both directions of the relationship were deleted
      const relation1 = await areaNeighborRepository.findOne({
        where: { areaId: testAreas[0].id, neighborId: testAreas[1].id }
      });
      const relation2 = await areaNeighborRepository.findOne({
        where: { areaId: testAreas[1].id, neighborId: testAreas[0].id }
      });

      expect(relation1).toBeNull();
      expect(relation2).toBeNull();
    });

    it('should return 400 when trying to remove relationship that would impact equipment', async () => {
      // This test would be more complex and require equipment in both areas
      // We'll implement it in the equipment-areas.test.ts
    });
  });

  describe('GET /areas/{areaId}/neighbors/{neighborId}', () => {
    it('should return true when areas are neighbors', async () => {
      // Create the relationship first
      await areaNeighborRepository.save([
        { areaId: testAreas[0].id, neighborId: testAreas[1].id },
        { areaId: testAreas[1].id, neighborId: testAreas[0].id }
      ]);

      const response = await request(app)
        .get(`/areas/${testAreas[0].id}/neighbors/${testAreas[1].id}`)
        .expect(200);

      expect(response.body).toEqual({ areNeighbors: true });
    });

    it('should return false when areas are not neighbors', async () => {
      const response = await request(app)
        .get(`/areas/${testAreas[0].id}/neighbors/${testAreas[1].id}`)
        .expect(200);

      expect(response.body).toEqual({ areNeighbors: false });
    });
  });
});