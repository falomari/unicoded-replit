import { catalog } from "./_catalog";

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
};

export default function handler(_req: unknown, res: ResponseLike) {
  res.status(200).json(catalog);
}