import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';

export const User = createParamDecorator((_data: string | undefined, _ctx: ExecutionContext) => {
    const cls = ClsServiceManager.getClsService();
    return cls.get('authUser');
});
