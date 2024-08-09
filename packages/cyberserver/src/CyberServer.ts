// src/CyberServer.ts
import express, { Application, Request, Response, NextFunction, RequestHandler } from 'express';
import https from 'https';
import cors, { CorsOptions } from 'cors';
import morgan from 'morgan';
import bodyParser, { OptionsJson, OptionsUrlencoded } from 'body-parser';
import helmet, { HelmetOptions } from 'helmet';
import compression, { CompressionOptions } from 'compression';

export interface CyberServerConfig {
    port?: number;
    httpsOptions?: https.ServerOptions;
    corsOptions?: CorsOptions;
    helmetOptions?: HelmetOptions;
    compressionOptions?: CompressionOptions;
    bodyParserJsonOptions?: OptionsJson;
    bodyParserUrlencodedOptions?: OptionsUrlencoded;
    enableCors?: boolean;
    enableHelmet?: boolean;
    enableCompression?: boolean;
    enableBodyParser?: boolean;
    enableRateLimiting?: boolean;
    customMiddlewares?: Array<RequestHandler>;
    extendCore?: (app: Application) => void;
    customErrorHandler?: (err: Error, req: Request, res: Response, next: NextFunction) => void;
}

export class CyberServer {
    private app: Application;
    private config: CyberServerConfig;

    // Default configurations for middleware
    private defaultCorsOptions: CorsOptions = {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };

    private defaultHelmetOptions: HelmetOptions = {
        contentSecurityPolicy: false,
    };

    private defaultCompressionOptions: CompressionOptions = {
        level: 6,
    };

    private defaultBodyParserJsonOptions: OptionsJson = {
        limit: '10mb',
    };

    private defaultBodyParserUrlencodedOptions: OptionsUrlencoded = {
        limit: '10mb',
        extended: true,
    };

    constructor(config: CyberServerConfig = {}) {
        this.config = config;
        this.app = express();
        this.setupMiddlewares();
    }

    private setupMiddlewares() {
        if (this.config.enableHelmet !== false) {
            this.app.use(helmet(this.config.helmetOptions || this.defaultHelmetOptions));
        }
        if (this.config.enableCors !== false) {
            this.app.use(cors(this.config.corsOptions || this.defaultCorsOptions));
        }
        if (this.config.enableCompression !== false) {
            this.app.use(compression(this.config.compressionOptions || this.defaultCompressionOptions));
        }
        if (this.config.enableBodyParser !== false) {
            this.app.use(bodyParser.json(this.config.bodyParserJsonOptions || this.defaultBodyParserJsonOptions));
            this.app.use(bodyParser.urlencoded(this.config.bodyParserUrlencodedOptions || this.defaultBodyParserUrlencodedOptions));
        }

        if (this.config.enableRateLimiting) {
            const limiter = this.setupRateLimiting();
            this.app.use(limiter);
        }

        if (this.config.customMiddlewares) {
            this.config.customMiddlewares.forEach((middleware) => {
                this.app.use(middleware);
            });
        }

        if (this.config.extendCore) {
            this.config.extendCore(this.app);
        }

        this.setupLogging();
        this.setupErrorHandling();
    }

    private setupLogging() {
        const loggingMode = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
        this.app.use(morgan(loggingMode));
    }

    private setupRateLimiting(): RequestHandler {
        return (req, res, next) => {
            // Example rate limiting logic or use express-rate-limit here
            next();
        };
    }

    private setupErrorHandling() {
        const defaultErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack);
            const responseMessage = process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!';
            res.status(500).send(responseMessage);
        };

        this.app.use(this.config.customErrorHandler || defaultErrorHandler);
    }

    public start() {
        const serverPort = this.config.port || 3000;
        if (this.config.httpsOptions) {
            https.createServer(this.config.httpsOptions, this.app).listen(serverPort, () => {
                console.log(`CyberServer running securely on port ${serverPort}`);
            });
        } else {
            this.app.listen(serverPort, () => {
                console.log(`CyberServer running on port ${serverPort}`);
            });
        }
    }

    public addRoute(path: string, handler: (req: Request, res: Response) => void) {
        this.app.get(path, handler);
    }
}