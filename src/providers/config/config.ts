import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash';

export interface Config {
  limits: {
    totalCopayers: number;
    mPlusN: number;
  };

  wallet: {
    useLegacyAddress: boolean;
    requiredCopayers: number;
    totalCopayers: number;
    spendUnconfirmed: boolean;
    reconnectDelay: number;
    idleDurationMin: number;
    settings: {
      unitName: string;
      unitToSatoshi: number;
      unitDecimals: number;
      unitCode: string;
      alternativeName: string;
      alternativeIsoCode: string;
      defaultLanguage: string;
      feeLevel: string;
    };
  };

  bws: {
    url: string;
  };

  download: {
    bitpay: {
      url: string;
    };
    copay: {
      url: string;
    };
  };

  rateApp: {
    bitpay: {
      ios: string;
      android: string;
      wp: string;
    };
    copay: {
      ios: string;
      android: string;
      wp: string;
    };
  };

  lock: {
    method: any;
    value: any;
    bannedUntil: any;
  };

  recentTransactions: {
    enabled: boolean;
  };

  persistentLogsEnabled: boolean;

  showIntegration: {
    coinbase: boolean;
    glidera: boolean;
    debitcard: boolean;
    amazon: boolean;
    mercadolibre: boolean;
    shapeshift: boolean;
  };

  rates: {
    url: string;
  };

  release: {
    url: string;
  };

  pushNotificationsEnabled: boolean;

  confirmedTxsNotifications: {
    enabled: boolean;
  };

  emailNotifications: {
    enabled: boolean;
    email: string;
  };

  emailFor?: any;
  bwsFor?: any;
  aliasFor?: any;
  colorFor?: any;
  touchIdFor?: any;

  log: {
    weight: number;
  };

  blockExplorerUrl: {
    acm: string;
    bch: string;
  };
}

const configDefault: Config = {
  // wallet limits
  limits: {
    totalCopayers: 6,
    mPlusN: 100
  },

  // wallet default config
  wallet: {
    useLegacyAddress: false,
    requiredCopayers: 2,
    totalCopayers: 3,
    spendUnconfirmed: false,
    reconnectDelay: 5000,
    idleDurationMin: 4,
    settings: {
      unitName: 'ACM',
      unitToSatoshi: 100000000,
      unitDecimals: 8,
      unitCode: 'acm',
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
      defaultLanguage: '',
      feeLevel: 'normal'
    }
  },

  // Bitcore wallet service URL
  bws: {
    url: 'https://bws.actinium.org:3232/bws/api'
  },

  download: {
    bitpay: {
      url: 'https://actinium.org'
    },
    copay: {
      url: 'https://actinium.org'
    }
  },

  rateApp: {
    bitpay: {
      ios:
        'https://itunes.apple.com/app/bitpay-secure-bitcoin-wallet/id1149581638',
      android:
        'https://play.google.com/store/apps/details?id=com.bitpay.wallet',
      wp: ''
    },
    copay: {
      ios: 'https://itunes.apple.com/app/copay-bitcoin-wallet/id951330296',
      android: 'https://play.google.com/store/apps/details?id=com.bitpay.copay',
      wp: ''
    }
  },

  lock: {
    method: null,
    value: null,
    bannedUntil: null
  },

  recentTransactions: {
    enabled: true
  },

  persistentLogsEnabled: true,

  // External services
  showIntegration: {
    coinbase: false,
    glidera: false,
    debitcard: false,
    amazon: false,
    mercadolibre: false,
    shapeshift: false
  },

  rates: {
    url: 'https://api.actinium.org/v1/acm/rates'
  },

  release: {
    url:
      'https://api.github.com/repos/Actinum-project/acm-copay/releases/latest'
  },

  pushNotificationsEnabled: true,

  confirmedTxsNotifications: {
    enabled: true
  },

  emailNotifications: {
    enabled: false,
    email: ''
  },

  log: {
    weight: 3
  },

  blockExplorerUrl: {
    acm: 'insight.actinium.org',
    bch: 'bch-insight.bitpay.com/#'
  }
};

@Injectable()
export class ConfigProvider {
  private configCache: Config;

  constructor(
    private logger: Logger,
    private persistence: PersistenceProvider
  ) {
    this.logger.debug('ConfigProvider initialized');
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.persistence
        .getConfig()
        .then((config: Config) => {
          if (!_.isEmpty(config)) {
            this.configCache = _.clone(config);
            this.backwardCompatibility();
          } else {
            this.configCache = _.clone(configDefault);
          }
          this.logImportantConfig(this.configCache);
          resolve();
        })
        .catch(err => {
          this.logger.error('Error Loading Config');
          reject(err);
        });
    });
  }

  private logImportantConfig(config: Config): void {
    const spendUnconfirmed = config.wallet.spendUnconfirmed;
    const useLegacyAddress = config.wallet.useLegacyAddress;
    const persistentLogsEnabled = config.persistentLogsEnabled;
    const lockMethod = config && config.lock ? config.lock.method : null;

    this.logger.debug(
      'Config | spendUnconfirmed: ' +
        spendUnconfirmed +
        ' - useLegacyAddress: ' +
        useLegacyAddress +
        ' - persistentLogsEnabled: ' +
        persistentLogsEnabled +
        ' - lockMethod: ' +
        lockMethod
    );
  }

  /**
   * @param newOpts object or string (JSON)
   */
  public set(newOpts) {
    let config = _.cloneDeep(configDefault);

    if (_.isString(newOpts)) {
      newOpts = JSON.parse(newOpts);
    }
    _.merge(config, this.configCache, newOpts);
    this.configCache = config;
    this.persistence.storeConfig(this.configCache).then(() => {
      this.logger.info('Config saved');
    });
  }

  public get(): Config {
    return this.configCache;
  }

  public getDefaults(): Config {
    return configDefault;
  }

  private backwardCompatibility() {
    // these ifs are to avoid migration problems
    if (this.configCache.bws) {
      this.configCache.bws = configDefault.bws;
    }
    if (!this.configCache.wallet) {
      this.configCache.wallet = configDefault.wallet;
    }
    if (!this.configCache.wallet.settings.unitCode) {
      this.configCache.wallet.settings.unitCode =
        configDefault.wallet.settings.unitCode;
    }
    if (!this.configCache.showIntegration) {
      this.configCache.showIntegration = configDefault.showIntegration;
    }
    if (!this.configCache.recentTransactions) {
      this.configCache.recentTransactions = configDefault.recentTransactions;
    }
    if (!this.configCache.persistentLogsEnabled) {
      this.configCache.persistentLogsEnabled =
        configDefault.persistentLogsEnabled;
    }
    if (!this.configCache.pushNotificationsEnabled) {
      this.configCache.pushNotificationsEnabled =
        configDefault.pushNotificationsEnabled;
    }
    if (!this.configCache.emailNotifications) {
      this.configCache.emailNotifications = configDefault.emailNotifications;
    }
    if (!this.configCache.lock) {
      this.configCache.lock = configDefault.lock;
    }
    if (!this.configCache.confirmedTxsNotifications) {
      this.configCache.confirmedTxsNotifications =
        configDefault.confirmedTxsNotifications;
    }

    if (this.configCache.wallet.settings.unitCode == 'bit') {
      // Convert to ACM. Bits will be disabled
      this.configCache.wallet.settings.unitName =
        configDefault.wallet.settings.unitName;
      this.configCache.wallet.settings.unitToSatoshi =
        configDefault.wallet.settings.unitToSatoshi;
      this.configCache.wallet.settings.unitDecimals =
        configDefault.wallet.settings.unitDecimals;
      this.configCache.wallet.settings.unitCode =
        configDefault.wallet.settings.unitCode;
    }
  }
}
