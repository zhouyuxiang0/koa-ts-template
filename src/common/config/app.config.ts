import * as Joi from 'joi'

import { BaseConfig } from './base-config.service';

export class AppConfig extends BaseConfig {
  validatorSchema(): Joi.ObjectSchema {
    return Joi.object({})
  }

  get APP_ID() {
    return this.envConfig
  }
}

export const appConfig = new AppConfig('.env')