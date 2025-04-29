import { middleware, type ExegesisContext } from 'exegesis-express';
import { apidocs } from './apidocs/index.ts';

const doc = apidocs.troubleshooter;

const troubleshooterApi = middleware(doc, { controllers: { helloController: { sayHello } } });

async function sayHello(ctx: ExegesisContext) {
	return ctx.res.status(200).json({ message: 'Hello!' });
}


export default troubleshooterApi