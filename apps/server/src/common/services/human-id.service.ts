// human-id.service.ts
import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

export interface HidOptions {
  prefix?: string;
  separator?: string;
  includeTimestamp?: boolean;
  wordCount?: number;
  includeNumbers?: boolean;
  customWords?: string[];
  length?: number;
  format?: 'adjective-noun' | 'word-numbers' | 'prefix-sequential' | 'nanoid-readable';
}

@Injectable()
export class HumanIdService {
  private readonly adjectives = [
    'happy', 'bright', 'swift', 'calm', 'bold', 'warm', 'cool', 'wise', 'kind', 'brave',
    'gentle', 'quick', 'smart', 'strong', 'clear', 'fresh', 'clean', 'smooth', 'light', 'deep',
    'vast', 'tiny', 'huge', 'soft', 'hard', 'fast', 'slow', 'new', 'old', 'young',
    'ancient', 'modern', 'simple', 'complex', 'easy', 'tough', 'mild', 'wild', 'tame', 'free'
  ];

  private readonly nouns = [
    'tiger', 'eagle', 'wolf', 'bear', 'lion', 'hawk', 'fox', 'deer', 'whale', 'shark',
    'river', 'mountain', 'ocean', 'forest', 'desert', 'valley', 'peak', 'storm', 'breeze', 'flame',
    'stone', 'crystal', 'diamond', 'gold', 'silver', 'copper', 'iron', 'steel', 'wood', 'glass',
    'star', 'moon', 'sun', 'cloud', 'rain', 'snow', 'wind', 'earth', 'fire', 'water',
    'book', 'key', 'door', 'path', 'bridge', 'tower', 'castle', 'garden', 'field', 'meadow'
  ];

  private readonly readableChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  
  private sequentialCounters = new Map<string, number>();

  /**
   * Generate a human-readable ID
   */
  generateHid(options: HidOptions = {}): string {
    const {
      format = 'adjective-noun',
      separator = '-',
      includeTimestamp = false,
      includeNumbers = true,
      prefix = '',
    } = options;

    let id: string;

    switch (format) {
      case 'adjective-noun':
        id = this.generateAdjectiveNoun(options);
        break;
      case 'word-numbers':
        id = this.generateWordNumbers(options);
        break;
      case 'prefix-sequential':
        id = this.generatePrefixSequential(options);
        break;
      case 'nanoid-readable':
        id = this.generateReadableNanoId(options);
        break;
      default:
        id = this.generateAdjectiveNoun(options);
    }

    // Add prefix if specified
    if (prefix) {
      id = `${prefix}${separator}${id}`;
    }

    // Add timestamp if requested
    if (includeTimestamp) {
      const timestamp = this.getTimestampSuffix();
      id = `${id}${separator}${timestamp}`;
    }

    return id;
  }

  /**
   * Generate adjective-noun combination: "happy-tiger-42"
   */
  private generateAdjectiveNoun(options: HidOptions): string {
    const { separator = '-', includeNumbers = true, customWords } = options;
    
    const adjectiveList = customWords?.filter(w => w.length < 8) || this.adjectives;
    const nounList = customWords?.filter(w => w.length < 8) || this.nouns;
    
    const adjective = this.getRandomElement(adjectiveList);
    const noun = this.getRandomElement(nounList);
    
    let id = `${adjective}${separator}${noun}`;
    
    if (includeNumbers) {
      const number = Math.floor(Math.random() * 999) + 1;
      id += `${separator}${number}`;
    }
    
    return id;
  }

  /**
   * Generate word with numbers: "tiger42swift"
   */
  private generateWordNumbers(options: HidOptions): string {
    const { wordCount = 2, includeNumbers = true, customWords } = options;
    
    const wordList = customWords || [...this.adjectives, ...this.nouns];
    const words: string[] = [];
    
    for (let i = 0; i < wordCount; i++) {
      words.push(this.getRandomElement(wordList));
    }
    
    let id = words.join('');
    
    if (includeNumbers) {
      const number = Math.floor(Math.random() * 99) + 10;
      // Insert number in middle or end
      const insertPos = Math.floor(Math.random() * (id.length - 1)) + 1;
      id = id.slice(0, insertPos) + number + id.slice(insertPos);
    }
    
    return id;
  }

  /**
   * Generate prefix with sequential number: "USR-001234"
   */
  private generatePrefixSequential(options: HidOptions): string {
    const { prefix = 'ID', separator = '-' } = options;
    
    const currentCount = this.sequentialCounters.get(prefix) || 0;
    const nextCount = currentCount + 1;
    this.sequentialCounters.set(prefix, nextCount);
    
    const paddedNumber = nextCount.toString().padStart(6, '0');
    return `${prefix}${separator}${paddedNumber}`;
  }

  /**
   * Generate readable nano-id style: "K3m9N2pR"
   */
  private generateReadableNanoId(options: HidOptions): string {
    const { length = 8 } = options;
    let id = '';
    
    for (let i = 0; i < length; i++) {
      id += this.readableChars.charAt(Math.floor(Math.random() * this.readableChars.length));
    }
    
    return id;
  }

  /**
   * Generate batch of unique HIDs
   */
  generateBatch(count: number, options: HidOptions = {}): string[] {
    const ids = new Set<string>();
    let attempts = 0;
    const maxAttempts = count * 10;
    
    while (ids.size < count && attempts < maxAttempts) {
      const id = this.generateHid(options);
      ids.add(id);
      attempts++;
    }
    
    if (ids.size < count) {
      throw new Error(`Could only generate ${ids.size} unique IDs out of ${count} requested`);
    }
    
    return Array.from(ids);
  }

  /**
   * Generate ID with checksum for validation
   */
  generateWithChecksum(options: HidOptions = {}): { id: string; checksum: string; full: string } {
    const id = this.generateHid(options);
    const checksum = this.generateChecksum(id);
    const full = `${id}-${checksum}`;
    
    return { id, checksum, full };
  }

  /**
   * Validate ID with checksum
   */
  validateChecksum(fullId: string): boolean {
    const parts = fullId.split('-');
    if (parts.length < 2) return false;
    
    const checksum = parts.pop();
    const id = parts.join('-');
    
    return this.generateChecksum(id) === checksum;
  }

  /**
   * Generate context-aware IDs
   */
  generateContextual(context: string, options: HidOptions = {}): string {
    const contextHash = createHash('md5').update(context).digest('hex').slice(0, 4);
    const baseId = this.generateHid(options);
    return `${baseId}-${contextHash}`;
  }

  /**
   * Generate memorable password-style ID
   */
  generateMemorablePassword(length: number = 12): string {
    const words: string[] = [];
    const targetLength = length;
    let currentLength = 0;
    
    while (currentLength < targetLength) {
      const word = this.getRandomElement([...this.adjectives, ...this.nouns]);
      if (currentLength + word.length + (words.length > 0 ? 1 : 0) <= targetLength) {
        words.push(word);
        currentLength += word.length + (words.length > 1 ? 1 : 0);
      } else {
        break;
      }
    }
    
    // Add numbers to reach target length
    while (currentLength < targetLength) {
      const digit = Math.floor(Math.random() * 10);
      words[words.length - 1] += digit;
      currentLength++;
    }
    
    return words.join('');
  }

  // Helper methods
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getTimestampSuffix(): string {
    return Date.now().toString(36).slice(-6);
  }

  private generateChecksum(input: string): string {
    return createHash('md5').update(input).digest('hex').slice(0, 4);
  }

  /**
   * Get readable representation of current timestamp
   */
  getReadableTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}`;
  }
}

// Usage examples and decorator for NestJS
export const GenerateHid = (options: HidOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const hidService = new HumanIdService();
      const hid = hidService.generateHid(options);
      
      // Add HID to request context or response
      if (this.request) {
        this.request.hid = hid;
      }
      
      return originalMethod.apply(this, [...args, hid]);
    };
    
    return descriptor;
  };
};

// Example usage in a controller:
/*
import { Controller, Post, Body } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly humanIdService: HumanIdService) {}

  @Post()
  async createUser(@Body() userData: any) {
    // Different HID formats
    const formats = {
      simple: this.humanIdService.generateHid(),
      withPrefix: this.humanIdService.generateHid({ prefix: 'USER', format: 'adjective-noun' }),
      sequential: this.humanIdService.generateHid({ prefix: 'USR', format: 'prefix-sequential' }),
      readable: this.humanIdService.generateHid({ format: 'nanoid-readable', length: 10 }),
      contextual: this.humanIdService.generateContextual(userData.email),
      withChecksum: this.humanIdService.generateWithChecksum({ prefix: 'SECURE' }),
      memorable: this.humanIdService.generateMemorablePassword(16)
    };

    console.log('Generated HIDs:', formats);
    
    return {
      user: userData,
      id: formats.withPrefix,
      internalId: formats.sequential
    };
  }

  @Post('batch')
  async createBatch() {
    const batchIds = this.humanIdService.generateBatch(10, {
      prefix: 'BATCH',
      format: 'adjective-noun',
      includeTimestamp: true
    });
    
    return { ids: batchIds };
  }
}

// Don't forget to add to your module:
@Module({
  providers: [HumanIdService],
  exports: [HumanIdService],
})
export class HumanIdModule {}
*/