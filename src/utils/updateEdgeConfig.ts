export type ItemOperation<K = string, V = unknown> =
  | {
      readonly operation: "delete";
      readonly key: K;
    }
  | {
      readonly operation: "create" | "update" | "upsert";
      readonly key: K;
      readonly value: V;
    };

export const updateEdgeConfig = async (
  id: string,
  token: string,
  items: ItemOperation[]
): Promise<Response> =>
  await fetch(`https://api.vercel.com/v1/edge-config/${id}/items`, {
    method: `PATCH`,
    headers: new Headers({
      Authorization: `Bearer ${token}`,
      "Content-Type": `application/json`
    }),
    body: JSON.stringify({
      items
    })
  });
