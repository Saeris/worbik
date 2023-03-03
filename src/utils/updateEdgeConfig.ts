const edgeConfigId = new URL(process.env.EDGE_CONFIG).pathname.replace(`/`, ``);

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
  items: ItemOperation[]
): Promise<Response> =>
  await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
    method: `PATCH`,
    headers: new Headers({
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      "Content-Type": `application/json`
    }),
    body: JSON.stringify({
      items
    })
  });
