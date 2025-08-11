export interface ReviewDto {
  id: string;
  orderId: string;
  artisanId: string;
  clientId: string;
  serviceId: string;
  comment: string;
  moderationNotes: string[];
  attachments: string[];
  artisanRating: number;
  serviceRating: number;
  ratingDimensions: {
    quality?: number;
    professionalism?: number;
    communication?: number;
    punctuality?: number;
  };
  quality?: number;
  date: Date;
  status: "pending" | "processing" | "published" | "flagged";
}
