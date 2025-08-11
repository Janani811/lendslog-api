import { Injectable, OnModuleInit } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class ExpensifyNotificationService implements OnModuleInit {
  private expo: Expo;

  onModuleInit() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true,
    });
  }

  getClient() {
    return this.expo;
  }

  async sendNotifications(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    const receipts: any[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        receipts.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notification chunk', error);
      }
    }

    return receipts;
  }
}
