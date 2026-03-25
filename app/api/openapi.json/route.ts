import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "AutoFlow API",
    version: "1.0.0",
    description: "Workflow automation HTTP API",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/workflows": {
      get: { summary: "List workflows", responses: { "200": { description: "OK" } } },
      post: { summary: "Create workflow", responses: { "200": { description: "OK" } } },
    },
    "/workflows/{id}": {
      get: { summary: "Get workflow", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      patch: { summary: "Update workflow", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete workflow", responses: { "200": { description: "OK" } } },
    },
    "/workflows/{id}/publish": {
      post: { summary: "Publish / unpublish", responses: { "200": { description: "OK" } } },
    },
    "/workflows/{id}/run": {
      post: { summary: "Run workflow", responses: { "200": { description: "OK" } } },
    },
    "/workflows/{id}/runs": {
      get: { summary: "List runs", responses: { "200": { description: "OK" } } },
    },
    "/workflows/{id}/nodes": {
      get: { summary: "List nodes", responses: { "200": { description: "OK" } } },
      post: { summary: "Create node", responses: { "200": { description: "OK" } } },
    },
    "/workflows/{id}/edges": {
      get: { summary: "List edges", responses: { "200": { description: "OK" } } },
      post: { summary: "Create edge", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete edge", responses: { "200": { description: "OK" } } },
    },
    "/nodes/{id}": {
      patch: { summary: "Update node", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete node", responses: { "200": { description: "OK" } } },
    },
    "/webhooks/{workflowId}": {
      get: { summary: "Webhook trigger (GET)", responses: { "200": { description: "OK" } } },
      post: { summary: "Webhook trigger (POST)", responses: { "200": { description: "OK" } } },
    },
    "/analytics": {
      get: { summary: "Analytics", responses: { "200": { description: "OK" } } },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
