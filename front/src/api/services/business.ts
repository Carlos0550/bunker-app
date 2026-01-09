import { BusinessData } from "@/types"
import client from "../client"

export const BusinessApi = {
    async retrieveBusiness () : Promise<BusinessData>{
        const response = await client.get("/business/")
        return response.data.businessData;
    }
}