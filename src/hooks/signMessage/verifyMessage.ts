import { Address, Message, MessageComputer } from '@multiversx/sdk-core/out';
import { getVerifier } from './getVerifier';

export const verifyMessage = (signedMessage: string) => {
  try {
    const { message, address, signature } = JSON.parse(signedMessage);

    const decodedMessage = Buffer.from(message.replace('0x', ''), 'hex');
    const decodedSignature = Buffer.from(signature.replace('0x', ''), 'hex');

    const verifier = getVerifier(address);

    const messageComputer = new MessageComputer();

    const msg = new Message({
      address: Address.newFromBech32(address),
      data: decodedMessage
    });

    const serializedMessage = messageComputer.computeBytesForVerifying(msg);

    const isVerified = verifier.verify(serializedMessage, decodedSignature);

    return {
      isVerified,
      message: decodedMessage.toString(),
      address
    };
  } catch {
    return {
      isVerified: false,
      message: '',
      address: ''
    };
  }
};
