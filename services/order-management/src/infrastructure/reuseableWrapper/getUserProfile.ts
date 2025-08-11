import { BadRequestError } from "@fixserv-colauncha/shared";
import { axiosClient } from "../clients/axiosClient";

export async function getServiceById(serviceId: string) {
  try {
    const response = await axiosClient({
      method: "get",
      url: `${process.env.SERVICE_MANAGEMENT_URL}/${serviceId}`,
    });

    return response.data;
  } catch (err) {
    console.error("Failed to fetch service from service-management:", err);
    throw new BadRequestError("Unable to fetch service details");
  }
}

export async function getClientById(clientId: string) {
  try {
    const response = await axiosClient({
      method: "get",
      url: `${process.env.USER_MANAGEMENT_URL}/user/${clientId}`,
    });

    return response.data;
  } catch (err) {
    console.error("Failed to fetch Client from user-management:", err);
    throw new BadRequestError("Unable to fetch Client details");
  }
}
export async function getOfferedServiceById(id: string) {
  try {
    const response = await axiosClient({
      method: "get",
      url: `${process.env.BASESERVICE_MANAGEMENT_URL}/getOffered/${id}`,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch OfferedService from service-management:",
      error
    );
    throw new BadRequestError("Unable to fetch OfferedService details");
  }
}
