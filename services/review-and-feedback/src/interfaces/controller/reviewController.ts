// interfaces/http/controllers/reviewController.ts
import { Request, Response } from "express";
import { ReviewService } from "../../application/services/reviewService";
import { RatingCalculator } from "../../domain/services/ratingCalculator";
import { Feedback } from "../../domain/entities/feedback";
import { Rating } from "../../domain/value-objects/rating";
import { BadRequestError } from "@fixserv-colauncha/shared";
export class ReviewController {
  constructor(
    private reviewService: ReviewService,
    private ratingCalculator: RatingCalculator
  ) {}

  async submitReview(req: Request, res: Response) {
    try {
      const {
        orderId,
        artisanId,
        clientId,
        serviceId,
        comment,
        artisanRating,
        serviceRating,
        ratingDimensions,
      } = req.body;

      const review = await this.reviewService.submitReview(
        orderId,
        artisanId,
        clientId,
        serviceId,
        new Feedback(comment),
        new Rating(artisanRating, ratingDimensions),
        new Rating(serviceRating, ratingDimensions)
      );

      res.status(201).json({ data: review.toDto() });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const { comment, artisanRating, serviceRating } = req.body;

      const review = await this.reviewService.updateReview(reviewId, {
        comment,
        artisanRating,
        serviceRating,
      });

      res.status(200).json({
        success: true,
        data: review.toDto(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getArtisanReviews(req: Request, res: Response) {
    try {
      const { artisanId } = req.params;
      let { status } = req.query;

      status = Array.isArray(status) ? status[0] : status;
      status = status?.toString().trim().toLowerCase();
      const reviews = await this.reviewService.findByArtisan(
        artisanId,
        status as string
      );

      if (status && status !== "published") {
        throw new BadRequestError("Unsupported status");
      }

      res.status(200).json({
        success: true,
        data: reviews.map((review) => review.toDto()),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getServiceReviews(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;
      let { status } = req.query;

      status = Array.isArray(status) ? status[0] : status;
      status = status?.toString().trim().toLowerCase();

      const reviews = await this.reviewService.findByService(
        serviceId,
        status as string
      );

      if (status && status !== "published") {
        throw new BadRequestError("Unsupported status");
      }
      res.status(200).json({
        success: true,
        data: reviews.map((review) => review.toDto()),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getArtisanAverageRating(req: Request, res: Response) {
    try {
      const { artisanId } = req.params;
      const average = await this.ratingCalculator.calculateAverageArtisanRating(
        artisanId
      );

      res.status(200).json({
        success: true,
        data: { artisanId, averageRating: average },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAllReviews(req: Request, res: Response) {
    try {
      const reviews = await this.reviewService.getAllReviews();

      res.status(200).json({
        success: true,
        data: reviews.map((review) => review.toDto()),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getReviewById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getReviewById(id);

      if (!review) {
        throw new BadRequestError("Review not found");
      }

      res.status(200).json({
        success: true,
        data: review.toDto(),
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  async getServiceAverageRating(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;
      const average = await this.ratingCalculator.calculateAverageServiceRating(
        serviceId
      );

      res.status(200).json({
        success: true,
        data: { serviceId, averageRating: average },
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      await this.reviewService.deleteReview(reviewId);
      res
        .status(200)
        .json({ success: true, message: "Review deleted successfully" });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  // async publishReview(req: Request, res: Response) {
  //  try {
  //    const { reviewId } = req.params;
  //    const review = await this.reviewService.publishReview(reviewId);
  //
  //    res.status(200).json({
  //      success: true,
  //      data: {
  //        id: review.id,
  //        status: review.status,
  //      },
  //    });
  //  } catch (error) {
  //    res.status(400).json({
  //      success: false,
  //      error: error.message,
  //    });
  //  }
  // }
}
