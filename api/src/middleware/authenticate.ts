import type { Accountability } from '@directus/types';
import type { NextFunction, Request, Response } from 'express';
import { isEqual } from 'lodash-es';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import asyncHandler from '../utils/async-handler.js';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
export const handler = async (req: Request, _res: Response, next: NextFunction) => {
	let defaultAccountability: Accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: getIPFromReq(req),
	};

	const userAgent = req.get('user-agent');
	if (userAgent) defaultAccountability.userAgent = userAgent;

	const origin = req.get('origin');
	if (origin) defaultAccountability.origin = origin;

	const database = getDatabase();

	const accountability = await getAccountabilityForToken(req.token, defaultAccountability);

	const customAccountability = await emitter.emitFilter(
		'authenticate',
		accountability,
		{
			req,
		},
		{
			database,
			schema: null,
			accountability: null,
		}
	);

	if (customAccountability && isEqual(customAccountability, accountability) === false) {
		req.accountability = customAccountability;
		return next();
	}

	req.accountability = req.accountability

	return next();
};

export default asyncHandler(handler);
