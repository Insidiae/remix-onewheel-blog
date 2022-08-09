import invariant from "tiny-invariant";

export function getEnv() {
  invariant(process.env.ADMIN_EMAIL, "Please set an ADMIN_EMAIL!");

  return {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
