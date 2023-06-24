import { Cart } from '@/entities/cart/cart.entity';
import { User } from '@/entities/user/user.entity';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  async afterInsert(event: InsertEvent<User>) {
    const { entity } = event;

    // Create a cart for the newly created user
    const cart = new Cart();
    cart.user = entity;
    // Set other properties of the cart if needed

    // Save the cart
    await event.manager.save(cart);
  }
}
