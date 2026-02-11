import { BadRequestError } from "@fixserv-colauncha/shared";
import { Certificate, CertificateStatus } from "./certificate";

export class Certificates {
  private readonly _certificates: Certificate[];
  private static readonly MAX_CERTIFICATES = 10;

  constructor(certificates: Certificate[] = []) {
    if (certificates.length > Certificates.MAX_CERTIFICATES) {
      throw new Error(
        `Maximum ${Certificates.MAX_CERTIFICATES} certificates allowed`,
      );
    }
    this._certificates = certificates;
  }

  get certificates(): Certificate[] {
    return [...this._certificates];
  }

  get count(): number {
    return this._certificates.length;
  }

  get pendingCount(): number {
    return this._certificates.filter((cert) => cert.isPending).length;
  }

  get approvedCount(): number {
    return this._certificates.filter((cert) => cert.isApproved).length;
  }

  get rejectedCount(): number {
    return this._certificates.filter((cert) => cert.isRejected).length;
  }

  get hasPendingCertificates(): boolean {
    return this.pendingCount > 0;
  }

  get hasApprovedCertificates(): boolean {
    return this.approvedCount > 0;
  }

  addCertificate(certificate: Certificate): Certificates {
    if (this._certificates.length >= Certificates.MAX_CERTIFICATES) {
      throw new Error(
        `Cannot add more than ${Certificates.MAX_CERTIFICATES} certificates`,
      );
    }

    // Check for duplicate certificate IDs
    if (this._certificates.some((cert) => cert.id === certificate.id)) {
      throw new BadRequestError("Certificate with this ID already exists");
    }

    return new Certificates([...this._certificates, certificate]);
  }

  removeCertificate(certificateId: string): Certificates {
    const filtered = this._certificates.filter(
      (cert) => cert.id !== certificateId,
    );

    if (filtered.length === this._certificates.length) {
      throw new BadRequestError("Certificate not found");
    }

    return new Certificates(filtered);
  }

  updateCertificate(updatedCertificate: Certificate): Certificates {
    const index = this._certificates.findIndex(
      (cert) => cert.id === updatedCertificate.id,
    );

    if (index === -1) {
      throw new Error("Certificate not found");
    }

    const updated = [...this._certificates];
    updated[index] = updatedCertificate;

    return new Certificates(updated);
  }

  getCertificateById(id: string): Certificate | undefined {
    return this._certificates.find((cert) => cert.id === id);
  }

  getCertificatesByStatus(status: CertificateStatus): Certificate[] {
    return this._certificates.filter((cert) => cert.status === status);
  }

  approveCertificate(certificateId: string, adminId: string): Certificates {
    const certificate = this.getCertificateById(certificateId);
    if (!certificate) {
      throw new Error("Certificate not found");
    }

    const approvedCertificate = certificate.approve(adminId);
    return this.updateCertificate(approvedCertificate);
  }

  rejectCertificate(
    certificateId: string,
    adminId: string,
    reason: string,
  ): Certificates {
    const certificate = this.getCertificateById(certificateId);
    if (!certificate) {
      throw new Error("Certificate not found");
    }

    const rejectedCertificate = certificate.reject(adminId, reason);
    return this.updateCertificate(rejectedCertificate);
  }

  toJSON(): any[] {
    return this._certificates.map((cert) => cert.toJSON());
  }

  static fromJSON(data: any[]): Certificates {
    if (!Array.isArray(data)) {
      return new Certificates([]);
    }

    const certificates = data.map((item) => Certificate.fromJSON(item));
    return new Certificates(certificates);
  }
}
