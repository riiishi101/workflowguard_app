"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const compression_1 = require("compression");
const helmet_1 = require("helmet");
const express_rate_limit_1 = require("express-rate-limit");
const all_exceptions_filter_1 = require("./all-exceptions.filter");
const cookie_parser_1 = require("cookie-parser");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = require("express");
const server = (0, express_1.default)();
async function createNestServer(expressInstance = server) {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressInstance));
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));
    app.use((0, compression_1.default)());
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
    app.enableCors({
        origin: [
            'https://www.workflowguard.pro',
            'https://workflowguard.pro',
            'http://localhost:3000',
            'http://localhost:8080',
            process.env.FRONTEND_URL
        ].filter((v) => typeof v === 'string'),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.setGlobalPrefix('api');
    await app.init();
    return expressInstance;
}
if (process.env.VERCEL !== '1') {
    async function bootstrap() {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        app.use((0, compression_1.default)());
        const limiter = (0, express_rate_limit_1.rateLimit)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        app.use(limiter);
        app.enableCors({
            origin: [
                'https://www.workflowguard.pro',
                'https://workflowguard.pro',
                'http://localhost:3000',
                'http://localhost:8080',
                process.env.FRONTEND_URL
            ].filter((v) => typeof v === 'string'),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        app.use((0, cookie_parser_1.default)());
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
        app.setGlobalPrefix('api');
        const port = process.env.PORT || 3000;
        await app.listen(port);
        console.log(`🚀 WorkflowGuard API running on port ${port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://www.workflowguard.pro'}`);
    }
    bootstrap();
}
exports.default = server;
if (process.env.VERCEL === '1') {
    createNestServer();
}
//# sourceMappingURL=main.js.map