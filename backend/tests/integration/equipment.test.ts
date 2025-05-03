import request from 'supertest';
import { app } from '../../src/app';
import { Equipment } from '../../src/models/Equipment';
import { Area } from '../../src/models/Area';
import { Plant } from '../../src/models/Plant';
import { DatabaseContext } from '../../src/config/database-context';
import { Repository } from 'typeorm';
import { beforeEach, describe, it, expect } from '@jest/globals';


describe('Equipment Controller Integration Tests', () => {
  let equipmentRepository: Repository<Equipment>;
  let areaRepository: Repository<Area>;
  let plantRepository: Repository<Plant>;
  let testArea: Area;
  let testPlant: Plant;

  beforeEach(async () => {
    equipmentRepository = DatabaseContext.getInstance().getRepository(Equipment);
    areaRepository = DatabaseContext.getInstance().getRepository(Area);
    plantRepository = DatabaseContext.getInstance().getRepository(Plant);
    
    // Clear the tables before each test
    await equipmentRepository.clear();
    await areaRepository.clear();
    await plantRepository.clear();

    // Create a test plant and area for equipment associations
    testPlant = await plantRepository.save(
      plantRepository.create({
        name: 'Test Plant',
        address: 'Test Address'
      })
    );

    testArea = await areaRepository.save(
      areaRepository.create({
        name: 'Test Area',
        locationDescription: 'Test Location',
        plantId: testPlant.id
      })
    );
  });

  describe('GET /equipment', () => {
    it('should return all equipment', async () => {
      const initialDate = new Date('2024-01-01');
      // Create test equipment
      const testEquipment = [
        equipmentRepository.create({
          name: 'Test Equipment 1',
          manufacturer: 'Manufacturer 1',
          serialNumber: 'SN001',
          initialOperationsDate: initialDate,
          areaId: testArea.id
        }),
        equipmentRepository.create({
          name: 'Test Equipment 2',
          manufacturer: 'Manufacturer 2',
          serialNumber: 'SN002',
          initialOperationsDate: initialDate,
          areaId: testArea.id
        })
      ];
      await equipmentRepository.save(testEquipment);

      const response = await request(app)
        .get('/equipment')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Equipment 1',
            manufacturer: 'Manufacturer 1',
            serialNumber: 'SN001',
            areaId: testArea.id
          }),
          expect.objectContaining({
            name: 'Test Equipment 2',
            manufacturer: 'Manufacturer 2',
            serialNumber: 'SN002',
            areaId: testArea.id
          })
        ])
      );
    });

    it('should return an empty array when no equipment exists', async () => {
      const response = await request(app)
        .get('/equipment')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /equipment/:id', () => {
    it('should return a specific equipment by ID', async () => {
      const initialDate = new Date('2024-01-01');
      const equipment = await equipmentRepository.save(
        equipmentRepository.create({
          name: 'Test Equipment',
          manufacturer: 'Test Manufacturer',
          serialNumber: 'TST001',
          initialOperationsDate: initialDate,
          areaId: testArea.id
        })
      );

      const response = await request(app)
        .get(`/equipment/${equipment.id}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: equipment.id,
          name: 'Test Equipment',
          manufacturer: 'Test Manufacturer',
          serialNumber: 'TST001',
          areaId: testArea.id
        })
      );
    });

    it('should return 404 when equipment ID does not exist', async () => {
      await request(app)
        .get('/equipment/nonexistent-id')
        .expect(404);
    });
  });

  describe('POST /equipment', () => {
    it('should create new equipment with valid data', async () => {
      const initialDate = new Date('2024-01-01');
      const newEquipment = {
        name: 'New Equipment',
        manufacturer: 'New Manufacturer',
        serialNumber: 'NEW001',
        initialOperationsDate: initialDate.toISOString(),
        areaId: testArea.id
      };

      const response = await request(app)
        .post('/equipment')
        .send(newEquipment)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: newEquipment.name,
          manufacturer: newEquipment.manufacturer,
          serialNumber: newEquipment.serialNumber,
          areaId: newEquipment.areaId
        })
      );

      // Verify equipment was created in database
      const savedEquipment = await equipmentRepository.findOne({ where: { id: response.body.id } });
      expect(savedEquipment).toBeTruthy();
      expect(savedEquipment?.name).toBe(newEquipment.name);
    });

    it('should reject equipment creation with missing required fields', async () => {
      const invalidEquipment = {
        manufacturer: 'Missing Name',
        areaId: testArea.id
      };

      await request(app)
        .post('/equipment')
        .send(invalidEquipment)
        .expect(400);
    });

    it('should reject equipment creation with non-existent area ID', async () => {
      const initialDate = new Date('2024-01-01');
      const invalidEquipment = {
        name: 'Test Equipment',
        manufacturer: 'Test Manufacturer',
        serialNumber: 'TST001',
        initialOperationsDate: initialDate.toISOString(),
        areaId: 'nonexistent-id'
      };

      await request(app)
        .post('/equipment')
        .send(invalidEquipment)
        .expect(400);
    });
  });

  describe('PUT /equipment/:id', () => {
    it('should update existing equipment', async () => {
      const initialDate = new Date('2024-01-01');
      const equipment = await equipmentRepository.save(
        equipmentRepository.create({
          name: 'Original Name',
          manufacturer: 'Original Manufacturer',
          serialNumber: 'ORG001',
          initialOperationsDate: initialDate,
          areaId: testArea.id
        })
      );

      const updateData = {
        name: 'Updated Name',
        manufacturer: 'Updated Manufacturer'
      };

      const response = await request(app)
        .put(`/equipment/${equipment.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: equipment.id,
          name: updateData.name,
          manufacturer: updateData.manufacturer,
          areaId: testArea.id
        })
      );

      // Verify update in database
      const updatedEquipment = await equipmentRepository.findOne({ where: { id: equipment.id } });
      expect(updatedEquipment?.name).toBe(updateData.name);
    });

    it('should return 404 when updating non-existent equipment', async () => {
      await request(app)
        .put('/equipment/nonexistent-id')
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('should handle partial updates', async () => {
      const initialDate = new Date('2024-01-01');
      const equipment = await equipmentRepository.save(
        equipmentRepository.create({
          name: 'Original Name',
          manufacturer: 'Original Manufacturer',
          serialNumber: 'ORG001',
          initialOperationsDate: initialDate,
          areaId: testArea.id
        })
      );

      const response = await request(app)
        .put(`/equipment/${equipment.id}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'Updated Name',
          manufacturer: 'Original Manufacturer'
        })
      );
    });
  });

  describe('DELETE /equipment/:id', () => {
    it('should delete existing equipment', async () => {
      const initialDate = new Date('2024-01-01');
      const equipment = await equipmentRepository.save(
        equipmentRepository.create({
          name: 'To Delete',
          manufacturer: 'Delete Manufacturer',
          serialNumber: 'DEL001',
          initialOperationsDate: initialDate,
          areaId: testArea.id
        })
      );

      await request(app)
        .delete(`/equipment/${equipment.id}`)
        .expect(204);

      // Verify equipment was deleted
      const deletedEquipment = await equipmentRepository.findOne({ where: { id: equipment.id } });
      expect(deletedEquipment).toBeNull();
    });

    it('should return 404 when deleting non-existent equipment', async () => {
      await request(app)
        .delete('/equipment/nonexistent-id')
        .expect(404);
    });
  });
}); 