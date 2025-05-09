import { DataSource } from "typeorm";
import { Plant } from "../models/Plant";
import { Area } from "../models/Area";
import { Equipment } from "../models/Equipment";
import { Part, PartType } from "../models/Part";
import { Maintenance, MaintenanceRecurrenceEnum } from "../models/Maintenance";

export async function seedDatabase(dataSource: DataSource) {
    // Check if database is empty
    const plantCount = await dataSource.getRepository(Plant).count();
    if (plantCount > 0) {
        console.log("Database already seeded. Skipping...");
        return;
    }

    console.log("Seeding database with demo data...");

    // Create Plants
    const plants = await dataSource.getRepository(Plant).save([
        {
            name: "Data Center São Paulo",
            address: "Av. Paulista, 1000 - São Paulo, SP"
        },
        {
            name: "Refinaria Rio de Janeiro",
            address: "Av. Brasil, 500 - Rio de Janeiro, RJ"
        },
        {
            name: "Complexo Agrícola Goiás",
            address: "Rodovia GO-020, Km 50 - Goiânia, GO"
        },
        {
            name: "Data Center Fortaleza",
            address: "Av. Washington Soares, 200 - Fortaleza, CE"
        },
        {
            name: "Refinaria Paulínia",
            address: "Rod. SP-332, Km 132 - Paulínia, SP"
        }
    ]);

    // Create Areas for each plant
    const areaRepository = dataSource.getRepository(Area);
    const areas: Area[] = [];

    // Data Center São Paulo Areas
    areas.push(
        ...([
            {
                name: "Sala de Servidores Principal",
                locationDescription: "Piso 1 - Ala Norte",
                plant: plants[0],
                plantId: plants[0].id
            },
            {
                name: "Área de Refrigeração",
                locationDescription: "Piso 1 - Ala Sul",
                plant: plants[0],
                plantId: plants[0].id
            },
            {
                name: "Sala de UPS",
                locationDescription: "Subsolo - Ala Leste",
                plant: plants[0],
                plantId: plants[0].id
            },
            {
                name: "Área de Telecomunicações",
                locationDescription: "Piso 2 - Ala Central",
                plant: plants[0],
                plantId: plants[0].id
            },
            {
                name: "Sala de Monitoramento",
                locationDescription: "Piso 2 - Ala Oeste",
                plant: plants[0],
                plantId: plants[0].id
            }
        ].map(area => areaRepository.create(area)))
    );

    // Refinaria Rio de Janeiro Areas
    areas.push(
        ...([
            {
                name: "Unidade de Destilação",
                locationDescription: "Setor A - Área Industrial",
                plant: plants[1],
                plantId: plants[1].id
            },
            {
                name: "Área de Caldeiras",
                locationDescription: "Setor B - Área Industrial",
                plant: plants[1],
                plantId: plants[1].id
            },
            {
                name: "Unidade de Compressores",
                locationDescription: "Setor C - Área Industrial",
                plant: plants[1],
                plantId: plants[1].id
            },
            {
                name: "Estação de Bombeamento",
                locationDescription: "Setor D - Área Industrial",
                plant: plants[1],
                plantId: plants[1].id
            },
            {
                name: "Central de Controle",
                locationDescription: "Prédio Administrativo - Piso 1",
                plant: plants[1],
                plantId: plants[1].id
            }
        ].map(area => areaRepository.create(area)))
    );

    // Complexo Agrícola Goiás Areas
    areas.push(
        ...([
            {
                name: "Armazém de Grãos",
                locationDescription: "Setor 1 - Área de Armazenamento",
                plant: plants[2],
                plantId: plants[2].id
            },
            {
                name: "Área de Manutenção",
                locationDescription: "Setor 2 - Oficina",
                plant: plants[2],
                plantId: plants[2].id
            },
            {
                name: "Centro de Distribuição",
                locationDescription: "Setor 3 - Logística",
                plant: plants[2],
                plantId: plants[2].id
            },
            {
                name: "Área de Processamento",
                locationDescription: "Setor 4 - Beneficiamento",
                plant: plants[2],
                plantId: plants[2].id
            },
            {
                name: "Pátio de Máquinas",
                locationDescription: "Setor 5 - Área Externa",
                plant: plants[2],
                plantId: plants[2].id
            }
        ].map(area => areaRepository.create(area)))
    );

    // Data Center Fortaleza Areas
    areas.push(
        ...([
            {
                name: "Sala de Servidores A",
                locationDescription: "Piso 1 - Bloco A",
                plant: plants[3],
                plantId: plants[3].id
            },
            {
                name: "Sala de Energia",
                locationDescription: "Térreo - Bloco B",
                plant: plants[3],
                plantId: plants[3].id
            },
            {
                name: "NOC",
                locationDescription: "Piso 2 - Bloco A",
                plant: plants[3],
                plantId: plants[3].id
            },
            {
                name: "Área de Backup",
                locationDescription: "Piso 1 - Bloco B",
                plant: plants[3],
                plantId: plants[3].id
            },
            {
                name: "Sala de Conectividade",
                locationDescription: "Piso 2 - Bloco B",
                plant: plants[3],
                plantId: plants[3].id
            }
        ].map(area => areaRepository.create(area)))
    );

    // Refinaria Paulínia Areas
    areas.push(
        ...([
            {
                name: "Unidade de Craqueamento",
                locationDescription: "Área Industrial - Setor 1",
                plant: plants[4],
                plantId: plants[4].id
            },
            {
                name: "Área de Tancagem",
                locationDescription: "Área Industrial - Setor 2",
                plant: plants[4],
                plantId: plants[4].id
            },
            {
                name: "Central de Utilidades",
                locationDescription: "Área Industrial - Setor 3",
                plant: plants[4],
                plantId: plants[4].id
            },
            {
                name: "Unidade de Tratamento",
                locationDescription: "Área Industrial - Setor 4",
                plant: plants[4],
                plantId: plants[4].id
            },
            {
                name: "Laboratório de Controle",
                locationDescription: "Prédio Técnico - Piso 1",
                plant: plants[4],
                plantId: plants[4].id
            }
        ].map(area => areaRepository.create(area)))
    );

    const savedAreas = await areaRepository.save(areas);

    // Create Equipment and Parts for each area
    const equipmentRepository = dataSource.getRepository(Equipment);
    const partRepository = dataSource.getRepository(Part);

    for (const area of savedAreas) {
        let equipmentList = [];

        // Data Center Equipment
        if (area.plant?.name?.includes("Data Center")) {
            equipmentList = [
                {
                    name: "Rack de Servidores Dell R740",
                    manufacturer: "Dell EMC",
                    serialNumber: `DELL-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-01-15"),
                    area,
                    areaId: area.id
                },
                {
                    name: "Switch Cisco Nexus 9300",
                    manufacturer: "Cisco",
                    serialNumber: `CISCO-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-01-15"),
                    area,
                    areaId: area.id
                },
                {
                    name: "UPS Symmetra PX 100kW",
                    manufacturer: "APC",
                    serialNumber: `APC-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-01-20"),
                    area,
                    areaId: area.id
                }
            ].map(eq => equipmentRepository.create(eq));
        }
        // Refinery Equipment
        else if (area.plant?.name?.includes("Refinaria")) {
            equipmentList = [
                {
                    name: "Caldeira Industrial B-2500",
                    manufacturer: "Aalborg",
                    serialNumber: `CALB-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-02-01"),
                    area,
                    areaId: area.id
                },
                {
                    name: "Compressor de Gás C-3000",
                    manufacturer: "Atlas Copco",
                    serialNumber: `COMP-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-02-01"),
                    area,
                    areaId: area.id
                },
                {
                    name: "Bomba Centrífuga P-1500",
                    manufacturer: "KSB",
                    serialNumber: `BOMB-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-02-15"),
                    area,
                    areaId: area.id
                }
            ].map(eq => equipmentRepository.create(eq));
        }
        // Agricultural Equipment
        else {
            equipmentList = [
                {
                    name: "Trator John Deere 6M",
                    manufacturer: "John Deere",
                    serialNumber: `JD-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-01-10"),
                    area,
                    areaId: area.id
                },
                {
                    name: "Colheitadeira New Holland TC5090",
                    manufacturer: "New Holland",
                    serialNumber: `NH-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-01-15"),
                    area,
                    areaId: area.id
                },
                {
                    name: "Sistema de Irrigação Valley",
                    manufacturer: "Valley",
                    serialNumber: `VAL-${area.id.substring(0, 6)}`,
                    initialOperationsDate: new Date("2024-02-01"),
                    area,
                    areaId: area.id
                }
            ].map(eq => equipmentRepository.create(eq));
        }

        const savedEquipment = await equipmentRepository.save(equipmentList);

        // Create Parts for each equipment
        for (const equipment of savedEquipment) {
            const partsList = [];

            // Data Center Parts
            if (equipment.name.includes("Rack") || equipment.name.includes("Switch") || equipment.name.includes("UPS")) {
                partsList.push(
                    ...[
                        {
                            name: "Fonte de Alimentação",
                            type: PartType.ELECTRIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `PWR-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Placa de Controle",
                            type: PartType.ELECTRONIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `CTRL-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Sistema de Ventilação",
                            type: PartType.MECHANICAL,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `FAN-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Módulo de Monitoramento",
                            type: PartType.ELECTRONIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `MON-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        }
                    ].map(part => partRepository.create(part))
                );
            }
            // Refinery Parts
            else if (equipment.name.includes("Caldeira") || equipment.name.includes("Compressor") || equipment.name.includes("Bomba")) {
                partsList.push(
                    ...[
                        {
                            name: "Motor Principal",
                            type: PartType.MECHANICAL,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `MOT-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Sistema Hidráulico",
                            type: PartType.HYDRAULICAL,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `HYD-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Painel de Controle",
                            type: PartType.ELECTRONIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `PNL-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Sistema de Monitoramento",
                            type: PartType.ELECTRONIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `MON-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        }
                    ].map(part => partRepository.create(part))
                );
            }
            // Agricultural Parts
            else {
                partsList.push(
                    ...[
                        {
                            name: "Motor Diesel",
                            type: PartType.MECHANICAL,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `ENG-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Sistema Hidráulico",
                            type: PartType.HYDRAULICAL,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `HYD-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Sistema Elétrico",
                            type: PartType.ELECTRIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `ELE-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        },
                        {
                            name: "Computador de Bordo",
                            type: PartType.ELECTRONIC,
                            manufacturer: equipment.manufacturer,
                            serialNumber: `CPU-${equipment.id.substring(0, 6)}`,
                            installationDate: equipment.initialOperationsDate,
                            equipment,
                            equipmentId: equipment.id
                        }
                    ].map(part => partRepository.create(part))
                );
            }

            await partRepository.save(partsList);
        }
    }

    const maintenanceRepository = dataSource.getRepository(Maintenance);
    const allParts = await partRepository.find();

    const today = new Date();

    const sampleMaintenances = allParts.slice(0, 10).flatMap((part, index) => {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + (index + 1) * 7);

        return [
            maintenanceRepository.create({
                title: `Initial Inspection for ${part.name}`,
                description: "Routine startup inspection",
                recurrence: MaintenanceRecurrenceEnum.NONE,
                scheduledDate: today,
                dueDate,
                part,
                partId: part.id,
            }),
            maintenanceRepository.create({
                title: `Monthly Check on ${part.name}`,
                description: "Monthly performance verification",
                recurrence: MaintenanceRecurrenceEnum.MONTHLY,
                dueDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()),
                part,
                partId: part.id,
            }),
        ];
    });

    await maintenanceRepository.save(sampleMaintenances);



    console.log("Database seeded successfully!");
} 