import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const accessToken = event.cookies.get("accessToken");

    if (accessToken) {
        console.log("Access Token Retrieved from Cookie:", accessToken);
    }

    return resolve(event);
};
