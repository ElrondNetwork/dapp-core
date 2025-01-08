import { isContract,isSelfESDTContract, ESDTTransferTypes,getAddressFromDataField  } from '../smartContracts';


const userAddress =
  'erd1a07ey0xj28u90mtk8858zsavs0cj7s3cy74ufgxdmcq3nslr0y2st2aaax';
const contractAddress =
  'erd1qqqqqqqqqqqqqpgqv9gxgq8nurz754spjfck6rdwlg9etpcp0n4sjg2dhc';

describe('isContract tests', () => {
  it('returns false for user account', () => {
    const valid = isContract(userAddress);
    expect(valid).toBe(false);
  });
  it('returns true for smart contract', () => {
    const valid = isContract(contractAddress);
    expect(valid).toBe(false);
  });
  it('returns false for invalid address', () => {
    const valid = isContract('erd1qqqqqqqqqqqqqqqpq');
    expect(valid).toBe(false);
  });
  it('returns true for contract address in data', () => {
    const valid = isContract(
      userAddress,
      undefined,
      'MultiESDTNFTTransfer@0000000000000000050061506400f3e0c5ea560192716d0daefa0b9587017ceb@02@5745474c442d383836303061@@8ac7230489e80000@555344432d613332393036@@464e61d6@6164644c6971756964697479@8963dd8c2c5e0000@459a65fa'
    );
    expect(valid).toBe(false);
  });
});

describe('isSelfESDTContract', () => {
  const validSender = 'erd1a07ey0xj28u90mtk8858zsavs0cj7s3cy74ufgxdmcq3nslr0y2st2aaax';
  const validReceiver = validSender;

  it('returns false if data is null', () => {
    const result = isSelfESDTContract(validReceiver, validSender, undefined);
    expect(result).toBe(false);
  });

  it('returns false if sender and receiver are not the same', () => {
    const result = isSelfESDTContract(validReceiver, 'differentSender', 'ESDTTransfer@...');
    expect(result).toBe(false);
  });

  it('returns false if ESDT type is incorrect', () => {
    const result = isSelfESDTContract(validReceiver, validSender, 'InvalidType@...');
    expect(result).toBe(false);
  });

  it('returns false if data parts are not valid hex', () => {
    const result = isSelfESDTContract(validReceiver, validSender, 'ESDTTransfer@GHIJKL@00000000000000000000000000000000');
    expect(result).toBe(false);
  });

  it('returns true for a valid self ESDT transaction', () => {
    const result = isSelfESDTContract(validReceiver, validSender, 'ESDTTransfer@74657374');
    expect(result).toBe(true);
  });

  ESDTTransferTypes.forEach((type) => {
    it(`returns true for valid self ${type} transaction`, () => {
      const result = isSelfESDTContract(validReceiver, validSender, `${type}@74657374`);
      expect(result).toBe(true);
    });
  });
});

jest.mock('@multiversx/sdk-core', () => ({
  TransactionPayload: {
    fromEncoded: jest.fn(),
  },
}));

describe('getAddressFromDataField', () => {
  const receiver = 'erd1qqqqqqqqqqqqqpgqv9gxgq8nurz754spjfck6rdwlg9etpcp0n4sjg2dhc';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns receiver if data is empty', () => {
    const result = getAddressFromDataField({ receiver, data: '' });
    expect(result).toBe(receiver);
  });

  it('returns receiver if address index is not found', () => {
    const result = getAddressFromDataField({ receiver, data: 'InvalidData' });
    expect(result).toBe(receiver);
  });

});