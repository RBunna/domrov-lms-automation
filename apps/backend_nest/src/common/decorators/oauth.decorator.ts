import { Injectable, CanActivate, ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


export const OAuthProvider = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const req = ctx.switchToHttp().getRequest();
        return req.params.provider;
    },
);

@Injectable()
export class DynamicOAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const provider = req.params.provider;
        if (!provider) return false;

        // Use NestJS AuthGuard dynamically
        const guard = new (AuthGuard(provider))();
        return guard.canActivate(context);
    }
}