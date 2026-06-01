import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Schemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: Schemas) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.query) {
      Object.defineProperty(request, "query", {
        value: schemas.query.parse(request.query),
        configurable: true
      });
    }

    if (schemas.params) {
      request.params = schemas.params.parse(request.params);
    }

    return next();
  };
}
