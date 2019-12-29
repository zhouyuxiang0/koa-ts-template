import * as Joi from 'joi';
import * as fs from 'fs';

import { DotenvParseOutput, parse } from 'dotenv';

interface IBaseConfig {
  validatorSchema(): Joi.ObjectSchema
}

export class BaseConfig implements IBaseConfig {
    protected readonly envConfig: DotenvParseOutput;

    public constructor(filePath: string) {
        filePath = '.env';
        const config = parse(fs.readFileSync(filePath));
        this.envConfig = this.validateInput(config);
    }

    validatorSchema(): Joi.ObjectSchema {
        throw new Error(`请重写validatorSchema方法`);
    }

    private validateInput(envConfig: DotenvParseOutput) {
        const envVarsSchema: Joi.ObjectSchema = this.validatorSchema();
        return this.validate(envConfig, envVarsSchema);
    }

    private validate(envConfig: DotenvParseOutput, envVarsSchema: Joi.ObjectSchema): DotenvParseOutput {
        const { error, value: validatedEnvConfig } = Joi.validate(envConfig, envVarsSchema, { allowUnknown: true });
        if (error) {
            this.validationError(error);
        }
        return validatedEnvConfig;
    }

    private validationError(error: Error): never {
        throw new Error(`Config validation error: ${error.message}`);
    }
}
