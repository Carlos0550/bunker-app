import { BusinessData } from "@/types"
import client from "../client"

export const BusinessApi = {
    async retrieveBusiness () : Promise<BusinessData>{
        const response = await client.get<{ success: boolean; data: BusinessData }>("/business/")
        return response.data.data;
    }
}