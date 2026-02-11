export enum CertificateStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CertificateType {
  IMAGE = "IMAGE",
  PDF = "PDF",
}

export interface ICertificate {
  id: string;
  name: string;
  fileUrl: string;
  fileType: CertificateType;
  uploadedAt: Date;
  status: CertificateStatus;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin ID
  rejectionReason?: string;
}

export class Certificate {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _fileUrl: string;
  private readonly _fileType: CertificateType;
  private readonly _uploadedAt: Date;
  private _status: CertificateStatus;
  private _reviewedAt?: Date;
  private _reviewedBy?: string;
  private _rejectionReason?: string;

  constructor(data: ICertificate) {
    this._id = data.id;
    this._name = data.name;
    this._fileUrl = data.fileUrl;
    this._fileType = data.fileType;
    this._uploadedAt = data.uploadedAt;
    this._status = data.status;
    this._reviewedAt = data.reviewedAt;
    this._reviewedBy = data.reviewedBy;
    this._rejectionReason = data.rejectionReason;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get fileUrl(): string {
    return this._fileUrl;
  }

  get fileType(): CertificateType {
    return this._fileType;
  }

  get uploadedAt(): Date {
    return this._uploadedAt;
  }

  get status(): CertificateStatus {
    return this._status;
  }

  get reviewedAt(): Date | undefined {
    return this._reviewedAt;
  }

  get reviewedBy(): string | undefined {
    return this._reviewedBy;
  }

  get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  get isPending(): boolean {
    return this._status === CertificateStatus.PENDING;
  }

  get isApproved(): boolean {
    return this._status === CertificateStatus.APPROVED;
  }

  get isRejected(): boolean {
    return this._status === CertificateStatus.REJECTED;
  }

  approve(adminId: string): Certificate {
    return new Certificate({
      id: this._id,
      name: this._name,
      fileUrl: this._fileUrl,
      fileType: this._fileType,
      uploadedAt: this._uploadedAt,
      status: CertificateStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });
  }

  reject(adminId: string, reason: string): Certificate {
    return new Certificate({
      id: this._id,
      name: this._name,
      fileUrl: this._fileUrl,
      fileType: this._fileType,
      uploadedAt: this._uploadedAt,
      status: CertificateStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      rejectionReason: reason,
    });
  }

  toJSON(): ICertificate {
    return {
      id: this._id,
      name: this._name,
      fileUrl: this._fileUrl,
      fileType: this._fileType,
      uploadedAt: this._uploadedAt,
      status: this._status,
      reviewedAt: this._reviewedAt,
      reviewedBy: this._reviewedBy,
      rejectionReason: this._rejectionReason,
    };
  }

  static fromJSON(data: any): Certificate {
    return new Certificate({
      id: data.id,
      name: data.name,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      uploadedAt: new Date(data.uploadedAt),
      status: data.status,
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
      reviewedBy: data.reviewedBy,
      rejectionReason: data.rejectionReason,
    });
  }

  static create(
    id: string,
    name: string,
    fileUrl: string,
    fileType: CertificateType,
  ): Certificate {
    return new Certificate({
      id,
      name,
      fileUrl,
      fileType,
      uploadedAt: new Date(),
      status: CertificateStatus.PENDING,
    });
  }
}
