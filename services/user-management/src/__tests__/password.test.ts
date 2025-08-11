import { Password } from "../domain/value-objects/password";

describe("Password value object", () => {
  it("Creates a hashed password and verify it correctly", async () => {
    const raw = "mySecret123!";
    const password = await Password.create(raw);
    expect(password.value).not.toEqual(raw);

    const isValid = await password.compare(raw);
    expect(isValid).toBe(true);

    const isInvalid = await password.compare("wrong-password");
    expect(isInvalid).toBe(false);
  });

  it("loads from existing hash and still verifies correctly", async () => {
    const raw = "initialPass";
    const password1 = await Password.create(raw);
    const hash = password1.value;

    const password2 = Password.fromHash(hash);
    expect(await password2.compare(raw)).toBe(true);
  });
});
