import express, { Request, Response } from "express";
import { SearchController } from "../../controller/searchController";
import { SearchService } from "../../../application/searchService";
import axios from "axios";

const router = express.Router();
const searchService = new SearchService();
const searchController = new SearchController(searchService);

const service = `${process.env.SEARCH_AND_DISCOVERY_URL}/
api/search/health`;
setInterval(async () => {
  const ENV = process.env.ENV?.toLowerCase();
  console.log(ENV);
  if (ENV !== "development") {
    console.log("Skipping health check pings in non-development environment");
    return
  }
  for (const url of [service]) {
    try {
      await axios.get(url, { timeout: 5000 });
      console.log(`✅ Pinged ${url}`);
    } catch (error: any) {
      console.error(`❌ Failed to ping ${url}:`, error.message);
    }
  }
}, 2 * 60 * 1000); // every 5 minutes
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "search-and-discovery-service",
  });
});

router.get("/", searchController.search.bind(searchController));

export { router as searchRouter };
