import { Router } from "express";

const router: Router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
