import businessServices from "@/services/business.services";
import { NextFunction, Request, Response } from "express";

class BusinessController {
    async getBusinessData(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;;

            if(!userId){
                return res.status(400).json({message: 'User is required'});
            }
            const businessData = await businessServices.getBusinessData(userId);
            res.status(200).json({businessData});
        } catch (error) {
            next(error);
        }
    }
}

export default new BusinessController();