import { Router, type IRouter } from "express";
import dinosRouter from "./dinos";
import healthRouter from "./health";
import mediaRouter from "./media";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dinosRouter);
router.use(mediaRouter);

export default router;
