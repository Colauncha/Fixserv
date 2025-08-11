import { BadRequestError } from "@fixserv-colauncha/shared";

export enum EscrowStatusEnum {
  NOT_PAID = "NOT_PAID",
  IN_ESCROW = "IN_ESCROW",
  RELEASED = "RELEASED",
  DISPUTED = "DISPUTED",
}

export class EscrowStatus {
  private readonly value: EscrowStatusEnum;
  constructor(value: EscrowStatusEnum) {
    if (!Object.values(EscrowStatusEnum).includes(value)) {
      throw new BadRequestError(`Invalid escrow status: ${value}`);
    }
    this.value = value;
  }

  public get statusValue() {
    return this.value;
  }

  public isPaid(): boolean {
    return (
      this.value === EscrowStatusEnum.IN_ESCROW ||
      this.value === EscrowStatusEnum.RELEASED
    );
  }

  public isReleased(): boolean {
    return this.value === EscrowStatusEnum.RELEASED;
  }

  public isDisputed(): boolean {
    return this.value === EscrowStatusEnum.DISPUTED;
  }

  public static initial(): EscrowStatus {
    return new EscrowStatus(EscrowStatusEnum.NOT_PAID);
  }

  public static fromString(value: string): EscrowStatus {
    return new EscrowStatus(value as EscrowStatusEnum);
  }
}
