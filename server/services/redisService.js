const redisClient = require('../config/redis');

class RedisService {
    static async getListWithMeta(listKey, metaKey) {
        try {
            const [listContent, metaString] = await Promise.all([
                redisClient.lRange(listKey, 0, -1),
                redisClient.get(metaKey),
            ]);

            if (listContent.length > 0 && metaString) {
                return {
                    list: listContent.map((item) => JSON.parse(item)),
                    meta: JSON.parse(metaString),
                };
            }
            return null;
        } catch (error) {
            console.error(`[Redis] Error fetching ${listKey}:`, error);
            return null;
        }
    }

    static async saveListWithMeta(listKey, listArray, metaKey, metaObj, ttlSeconds) {
        try {
            const stringifiedList = listArray.map((item) => JSON.stringify(item));
            const stringifiedMeta = JSON.stringify(metaObj);

            const multi = redisClient.multi();
            multi.del(listKey);

            if (stringifiedList.length > 0) multi.rPush(listKey, stringifiedList);

            multi.expire(listKey, ttlSeconds);
            multi.setEx(metaKey, ttlSeconds, stringifiedMeta);

            await multi.exec();
        } catch (error) {
            console.error(`[Redis] Error saving ${listKey}:`, error);
        }
    }

    static async appendToListWithMeta(listKey, newItem, maxLength, metaKey, ttlSeconds) {
        try {
            const cacheExists = await redisClient.exists(metaKey);
            if (!cacheExists) return false;

            const multi = redisClient.multi();
            multi.rPush(listKey, JSON.stringify(newItem));
            multi.lTrim(listKey, -maxLength, -1);
            multi.expire(listKey, ttlSeconds);
            multi.expire(metaKey, ttlSeconds);

            await multi.exec();
            return true;
        } catch (error) {
            console.error(`[Redis] Error appending to ${listKey}:`, error);
            return false;
        }
    }
}

module.exports = RedisService;
