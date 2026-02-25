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

    static async clearChatCache(listKey, metaKey) {
        try {
            const multi = redisClient.multi();
            multi.del(listKey);
            multi.del(metaKey);
            await multi.exec();
            return true;
        } catch (error) {
            console.error(`[Redis] Error clearing chat cache for ${listKey}:`, error);
            return false;
        }
    }

    static async removeMessage(listKey, metaKey, messageId, ttlSeconds) {
        try {
            const listContent = await redisClient.lRange(listKey, 0, -1);
            if (listContent.length === 0) return false;

            const parsedList = listContent.map((item) => JSON.parse(item));
            const filteredList = parsedList.filter((msg) => msg._id !== messageId);

            if (filteredList.length < parsedList.length) {
                const multi = redisClient.multi();
                multi.del(listKey);

                if (filteredList.length > 0) {
                    const stringifiedList = filteredList.map((item) => JSON.stringify(item));
                    multi.rPush(listKey, stringifiedList);
                    multi.expire(listKey, ttlSeconds);
                    multi.expire(metaKey, ttlSeconds);
                } else {
                    multi.del(metaKey);
                }

                await multi.exec();
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[Redis] Error removing message from ${listKey}:`, error);
            return false;
        }
    }
}

module.exports = RedisService;
