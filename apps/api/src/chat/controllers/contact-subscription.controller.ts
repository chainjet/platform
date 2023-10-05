import { resolveAddressName } from '@app/definitions/utils/address.utils'
import { BadRequestException, Body, Controller, Logger, Post, UnauthorizedException } from '@nestjs/common'
import { ethers } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { UserService } from '../../users/services/user.service'
import { ContactService } from '../services/contact.service'

@Controller('contact-subscription')
export class ContactSubscriptionController {
  private readonly logger = new Logger(ContactSubscriptionController.name)

  constructor(private contactService: ContactService, private userService: UserService) {}

  @Post('unsubscribe')
  async unsubscribe(
    @Body('address') contactAddress: string,
    @Body('message') message: string,
    @Body('signature') signature: string,
  ) {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature)

    if (recoveredAddress !== contactAddress) {
      throw new UnauthorizedException('Invalid signature')
    }

    const messageParts = message.split('\n')
    if (messageParts.length !== 2) {
      throw new BadRequestException('Invalid signed message')
    }
    const date = new Date(messageParts[1].split('Current time: ')[1])

    // signature expires after 1 hour
    if (Date.now() - date.getTime() > 60 * 60 * 1000) {
      throw new BadRequestException('Signature expired. Please try again.')
    }

    const unsubscribeFrom = messageParts[0].split('Unsubscribe from ')[1].split(' ')[0]

    let addressToUnsubscribeFrom = unsubscribeFrom
    if (!isAddress(unsubscribeFrom)) {
      addressToUnsubscribeFrom = await resolveAddressName(unsubscribeFrom)
    }
    if (!isAddress(addressToUnsubscribeFrom)) {
      throw new BadRequestException('Could not resolve address to unsubscribe from')
    }

    const user = await this.userService.findOne({ address: addressToUnsubscribeFrom })
    if (!user) {
      throw new BadRequestException('The address you want to unsubscribe from is not registered in ChainJet')
    }

    // if the contact doesn't exist, it's already not subscribed
    try {
      await this.contactService.updateOneNative(
        { owner: user, address: contactAddress },
        {
          $set: {
            subscribed: false,
          },
        },
      )
    } catch {}

    this.logger.log(
      `Unsubscribed ${contactAddress} from ${addressToUnsubscribeFrom}${
        unsubscribeFrom !== addressToUnsubscribeFrom ? ` (${unsubscribeFrom})` : ''
      }`,
    )

    return {
      success: true,
    }
  }
}
