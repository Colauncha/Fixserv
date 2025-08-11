import express from "express";
import { SearchController } from "../../controller/searchController";
import { SearchService } from "../../../application/searchService";

const router = express.Router();
const searchService = new SearchService();
const searchController = new SearchController(searchService);

router.get("/", searchController.search.bind(searchController));

export { router as searchRouter };
