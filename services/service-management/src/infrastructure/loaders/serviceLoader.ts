import DataLoader from "dataloader";
import { Service } from "../../domain/entities/service";
import { ServiceModel } from "../persistence/model/service";
import { ServiceDetails } from "../../domain/value-objects/serviceDetails";
import { SkillSet } from "../../modules-from-other-services/domain/value-objects/skillSet";

// Batch function to load many by IDs
const batchGetServices = async (ids: readonly string[]) => {
  const services = await ServiceModel.find({ _id: { $in: ids } }).lean();

  const serviceMap = new Map(
    services.map((doc) => [
      doc._id.toString(),
      new Service(
        doc._id,
        doc.artisanId,
        new ServiceDetails(
          doc.title,
          doc.description,
          doc.price,
          doc.estimatedDuration
        ),
        doc.isActive,
        doc.rating,
        SkillSet.create(doc.skillSet || [])
      ),
    ])
  );
  return ids.map((id) => serviceMap.get(id) || null);
};

export const serviceLoader = new DataLoader<string, Service | null>(
  batchGetServices
);
