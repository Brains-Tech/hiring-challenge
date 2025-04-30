// tests/integration/equipment-areas.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { Equipment } from '../../src/models/Equipment';
import { Area } from '../../src/models/Area';
import { Plant } from '../../src/models/Plant';
import { AreaNeighbor } from '../../src/models/AreaNeighbor';
import { EquipmentArea } from '../../src/models/EquipmentArea';
import { DatabaseContext } from '../../src/config/database-context';
import { Repository } from 'typeorm';
import { beforeEach, describe, it, expect } from '@jest/globals';

describe('Equipment Areas Integration Tests', () => {
  let equipmentRepository: Repository<Equipment>;
  let areaRepository: Repository<Area>;
  let plantRepository: Repository<Plant>;
  let areaNeighborRepository: Repository<AreaNeighbor>;
  let equipmentAreaRepository: Repository<EquipmentArea>;
  let testAreas: Area[];
  let testEquipment: Equipment;
  let testPlant: Plant;

  beforeEach(async () => {
    equipmentRepository = DatabaseContext.getInstance().getRepository(Equipment);
    areaRepository = DatabaseContext.getInstance().getRepository(Area);
    plantRepository = DatabaseContext.getInstance().getRepository(Plant);
    areaNeighborRepository = DatabaseContext.getInstance().getRepository(AreaNeighbor);
    equipmentAreaRepository = DatabaseContext.getInstance().getRepository(EquipmentArea);
    
    // Clear the tables before each test
    await equipmentAreaRepository.clear();
    await areaNeighborRepository.clear();
    await equipmentRepository.clear();
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

    // Create test equipment
    testEquipment = await equipmentRepository.save(
      equipmentRepository.create({
        name: 'Test Equipment',
        manufacturer: 'Test Manufacturer',
        serialNumber: 'TEST-1234',
        initialOperationsDate: new Date(),
        areaId: testAreas[0].id
      })
    );

    // Create neighbor relationships between areas 1 and 2
    await areaNeighborRepository.save([
      { areaId: testAreas[0].id, neighborId: testAreas[1].id },
      { areaId: testAreas[1].id, neighborId: testAreas[0].id }
    ]);
  });

  describe('GET /equipment/{equipmentId}/areas', () => {
    it('should return an empty array when equipment has no associated areas', async () => {
      // Create a new equipment without any area associations
      const newEquipment = await equipmentRepository.save(
        equipmentRepository.create({
          name: 'New Equipment',
          manufacturer: 'Test Manufacturer',
          serialNumber: 'NEW-1234',
          initialOperationsDate: new Date()
        })
      );

      const response = await request(app)
        .get(`/equipment/${newEquipment.id}/areas`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all areas associated with an equipment', async () => {
      // Associate equipment with multiple areas
      await equipmentAreaRepository.save([
        { equipmentId: testEquipment.id, areaId: testAreas[0].id, isPrimary: true },
        { equipmentId: testEquipment.id, areaId: testAreas[1].id, isPrimary: false }
      ]);

      const response = await request(app)
        .get(`/equipment/${testEquipment.id}/areas`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: testAreas[0].id }),
          expect.objectContaining({ id: testAreas[1].id })
        ])
      );
    });

    it('should return 404 for non-existent equipment', async () => {
      await request(app)
        .get('/equipment/non-existent-id/areas')
        .expect(404);
    });
  });

  describe('POST /equipment/{equipmentId}/areas', () => {
    it('should associate equipment with multiple areas', async () => {
      const response = await request(app)
        .post(`/equipment/${testEquipment.id}/areas`)
        .send({
          areaIds: [testAreas[0].id, testAreas[1].id],
          primaryAreaId: testAreas[0].id
        })
        .expect(200);

      // Verify the areas were associated with the equipment
      const equipmentAreas = await equipmentAreaRepository.find({
        where: { equipmentId: testEquipment.id }
      });

      expect(equipmentAreas).toHaveLength(2);
      expect(equipmentAreas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ areaId: testAreas[0].id, isPrimary: true }),
          expect.objectContaining({ areaId: testAreas[1].id, isPrimary: false })
        ])
      );

      // Verify the equipment is returned with updated area
      expect(response.body).toEqual(
        expect.objectContaining({
          id: testEquipment.id,
          areaId: testAreas[0].id
        })
      );
    });

    it('should return 400 when trying to associate with non-neighboring areas', async () => {
      // Area 0 and Area 2 are not neighbors
      await request(app)
        .post(`/equipment/${testEquipment.id}/areas`)
        .send({
          areaIds: [testAreas[0].id, testAreas[2].id]
        })
        .expect(400);
    });

    it('should return 400 when primary area is not in the area list', async () => {
      await request(app)
        .post(`/equipment/${testEquipment.id}/areas`)
        .send({
          areaIds: [testAreas[0].id, testAreas[1].id],
          primaryAreaId: testAreas[2].id
        })
        .expect(400);
    });

    it('should return 400 when area does not exist', async () => {
      await request(app)
        .post(`/equipment/${testEquipment.id}/areas`)
        .send({
          areaIds: [testAreas[0].id, 'non-existent-id']
        })
        .expect(400);
    });

    it('should return 404 for non-existent equipment', async () => {
      await request(app)
        .post('/equipment/non-existent-id/areas')
        .send({
          areaIds: [testAreas[0].id]
        })
        .expect(404);
    });
  });

  describe('GET /equipment/{equipmentId}/areas/{areaId}', () => {
    it('should return true when equipment is in area', async () => {
      // Associate equipment with area
      await equipmentAreaRepository.save({
        equipmentId: testEquipment.id,
        areaId: testAreas[0].id,
        isPrimary: true
      });

      const response = await request(app)
        .get(`/equipment/${testEquipment.id}/areas/${testAreas[0].id}`)
        .expect(200);

      expect(response.body).toEqual({ inArea: true });
    });

    it('should return false when equipment is not in area', async () => {
      const response = await request(app)
        .get(`/equipment/${testEquipment.id}/areas/${testAreas[2].id}`)
        .expect(200);

      expect(response.body).toEqual({ inArea: false });
    });
  });

  describe('GET /equipment/{equipmentId}/primaryArea', () => {
    it('should return the primary area of an equipment', async () => {
      // Associate equipment with multiple areas, one as primary
      await equipmentAreaRepository.save([
        { equipmentId: testEquipment.id, areaId: testAreas[0].id, isPrimary: true },
        { equipmentId: testEquipment.id, areaId: testAreas[1].id, isPrimary: false }
      ]);

      const response = await request(app)
        .get(`/equipment/${testEquipment.id}/primaryArea`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: testAreas[0].id,
          name: 'Area 1'
        })
      );
    });

    it('should return null when equipment has no primary area', async () => {
      const response = await request(app)
        .get(`/equipment/${testEquipment.id}/primaryArea`)
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('DELETE /areas/{areaId}/neighbors/{neighborId}', () => {
    it('should return 400 when trying to remove relationship with shared equipment', async () => {
      // Associate equipment with both areas
      await equipmentAreaRepository.save([
        { equipmentId: testEquipment.id, areaId: testAreas[0].id, isPrimary: true },
        { equipmentId: testEquipment.id, areaId: testAreas[1].id, isPrimary: false }
      ]);

      // Try to remove the neighbor relationship
      const response = await request(app)
        .delete(`/areas/${testAreas[0].id}/neighbors/${testAreas[1].id}`)
        .expect(400);

      // Verify the error message mentions shared equipment
      expect(response.body.message).toContain('equipamentos compartilhados');

      // Verify the relationship still exists
      const relation = await areaNeighborRepository.findOne({
        where: { areaId: testAreas[0].id, neighborId: testAreas[1].id }
      });
      expect(relation).toBeTruthy();
    });
  });
});