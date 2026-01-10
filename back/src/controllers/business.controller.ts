import businessServices from "@/services/business.services";
import { NextFunction, Request, Response } from "express";

class BusinessController {
    async getBusinessData(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if(!userId){
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'User is required',
                        statusCode: 400
                    }
                });
            }
            const businessData = await businessServices.getBusinessData(userId);
            res.status(200).json({
                success: true,
                data: businessData
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new BusinessController();