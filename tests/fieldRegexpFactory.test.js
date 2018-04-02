const assert = require('assert');
const ns = require('../lib/FieldRegexpFactory');

const { FieldRegexpFactory } = ns;

const patterns = {
  12: {
    pattern: '3!n',
    fieldNames: '',
  },
  19: {
    pattern: '17d',
    fieldNames: '(Amount)',
  },
  28: {
    pattern: '5n[/2n]',
    fieldNames: '(Page Number)(Indicator)',
  },
  '92B': {
    pattern: ':4!c//3!a/3!a/15d',
    fieldNames: '(Qualifier)(First Currency Code)(Second Currency Code)(Rate)',
  },
  '95P': {
    pattern: ':4!c//4!a2!a2!c[3!c]',
    fieldNames: '(Qualifier)(Identifier Code)',
  },
  '19A': {
    pattern: ':4!c//[N]3!a15d',
    fieldNames: '(Qualifier)(Sign)(Currency Code)(Amount)',
  },
  '98E': {
    pattern: ':4!c//8!n6!n[,3n][/[N]2!n[2!n]]',
    fieldNames: '(Qualifier)(Date)(Time)(Decimals)(UTC Sign)(UTC Indicator)',
  },
  '70G': {
    pattern: ':4!c//10*35z',
    fieldNames: '(Qualifier)(Narrative)',
  },
  '70F': {
    pattern: ':4!c//8000z',
    fieldNames: '(Qualifier)(Narrative)',
  },
  '35B': {
    pattern: '[ISIN1!e12!c]$[4*35x]',
    fieldNames: '(Identification of Security)$(Description of Security)',
  },
  '53D': {
    pattern: '[/1!a][/34x]$4*35x',
    fieldNames: '(Party Identifier)$(Name and Address)',
  },
  '77E': {
    pattern: '73x$[n*78x]',
    fieldNames: '(Text)$(Text)',
  },
};

describe('FieldRegexpFactory', () => {
  const factory = new FieldRegexpFactory();

  it('throws if there are more fields than patterns', () => {
    assert.throws(() => {
      factory.createRegexp('35x', '(Account)(xxx)');
    });
  });
  it('one field', () => {
    const r = factory.createRegexp('35x', '(Account)');
    assert.equal(r, '^(?<Account>.{1,35})$');
  });
  it('unnamed field', () => {
    const r = factory.createRegexp('35x', '');
    assert.equal(r, '^(?<Value>.{1,35})$');
  });
  it('one field optional', () => {
    const r = factory.createRegexp('[35x]', '(Account)');
    assert.equal(r, '^(?<Account>.{1,35})?$');
  });
  it('one field exact', () => {
    const r = factory.createRegexp('6!n', '(Date)');
    assert.equal(r, '^(?<Date>.{6})$');
  });
  it('one field exact optional', () => {
    const r = factory.createRegexp('[6!n]', '(Date)');
    assert.equal(r, '^(?<Date>.{6})?$');
  });
  it('two fields', () => {
    const r = factory.createRegexp('3!a15d', '(Type)(Quantity)');
    assert.equal(r, '^(?<Type>.{3})(?<Quantity>.{1,15})$');
  });
  it('two optional fields', () => {
    const r = factory.createRegexp('[3!a][15d]', '(Type)(Quantity)');
    assert.equal(r, '^(?<Type>.{3})?(?<Quantity>.{1,15})?$');
  });


  it('one multiline field', () => {
    const r = factory.createRegexp('5*35x', '(Narrative)');
    assert.equal(r, '^(?<Narrative>.{1,35}(\n.{1,35}){0,4})$');
  });
  it('more multiline field', () => {
    const r = factory.createRegexp('4!c//4*35x', '(Qualifier)(Narrative)');
    assert.equal(r, '^(?<Qualifier>.{4})//(?<Narrative>.{1,35}(\n.{1,35}){0,3})$');
  });


  it('two separated fields', () => {
    const r = factory.createRegexp('4!c//8!n', '(Qualifier)(Date)');
    assert.equal(r, '^(?<Qualifier>.{4})//(?<Date>.{8})$');
  });
  it('two separated optional fields', () => {
    const r = factory.createRegexp('5n[/2n]', '(PageNumber)(Indicator)');
    assert.equal(r, '^(?<PageNumber>.{1,5})(/(?<Indicator>.{1,2}))?$');
  });
  it('multiple separated fields', () => {
    const r = factory.createRegexp(':4!c//3!a/3!a/15d', '(Qualifier)(FirstCurrencyCode)(SecondCurrencyCode)(Rate)');
    assert.equal(r, '^:?(?<Qualifier>.{4})//(?<FirstCurrencyCode>.{3})/(?<SecondCurrencyCode>.{3})/(?<Rate>.{1,15})$');
  });

  it('leading colon', () => {
    const r = factory.createRegexp(':4!c//8!n', '(Qualifier)(Date)');
    assert.equal(r, '^:?(?<Qualifier>.{4})//(?<Date>.{8})$');
  });
  it('empty field names', () => {
    const r = factory.createRegexp('3!n', '');
    assert.equal(r, '^(?<Value>.{3})$');
  });

  // field merging
  it('merged fields', () => {
    const r = factory.createRegexp(':4!c//4!a2!a2!c[3!c]', '(Qualifier)(IdentifierCode)');
    assert.equal(r, '^:?(?<Qualifier>.{4})//(?<IdentifierCode>.{4}.{2}.{2}(.{3})?)$');
  });
  // sign
  it('named sign', () => {
    const r = factory.createRegexp('[N]3!n', '(Sign)(Number)');
    assert.equal(r, '^(?<Sign>N)?(?<Number>.{3})$');
  });
  // isin
  it('ISIN', () => {
    const r = factory.createRegexp('[ISIN1!e12!c]', '(IdentificationOfSecurity)');
    assert.equal(r, '^(ISIN {1}(?<IdentificationOfSecurity>.{12}))?$');
  });

  // multiline
  it('multiline pattern with mandatory parts', () => {
    const r = factory.createRegexp('3!a$5!a', '(First)$(Second)');
    assert.equal(r, '^(?<First>.{3})\n(?<Second>.{5})$');
  });
  it('multiline pattern with optional first part', () => {
    const r = factory.createRegexp('[3!a]$5!a', '(First)$(Second)');
    assert.equal(r, '^(?<First>.{3})?(\n)?(?<Second>.{5})$');
  });
  it('multiline pattern with optional second part', () => {
    const r = factory.createRegexp('3!a$[5!a]', '(First)$(Second)');
    assert.equal(r, '^(?<First>.{3})(\n)?(?<Second>.{5})?$');
  });
  it('multiline pattern with optional both parts', () => {
    const r = factory.createRegexp('[3!a]$[5!a]', '(First)$(Second)');
    assert.equal(r, '^(?<First>.{3})?(\n)?(?<Second>.{5})?$');
  });
  it('multiline pattern with multiple fields', () => {
    const r = factory.createRegexp('[/1!a][/34x]$4!a2!a2!c[3!c]', '(PartyIdentifier)$(IdentifierCode)');
    assert.equal(r, '^(?<PartyIdentifier>(/.{1})?(/.{1,34})?)(\n)?(?<IdentifierCode>.{4}.{2}.{2}(.{3})?)$');
  });
  it('multiline pattern with multiline field', () => {
    const r = factory.createRegexp('[/1!a][/34x]$4*35x', '(PartyIdentifier)$(NameAndAddress)');
    assert.equal(r, '^(?<PartyIdentifier>(/.{1})?(/.{1,34})?)(\n)?(?<NameAndAddress>.{1,35}(\n.{1,35}){0,3})$');
  });
  it('multiline pattern with three lines', () => {
    const r = factory.createRegexp('3!n$6!n$[4!n6!n]', '(MTNumber)$(Date)$(SessionNumber)(ISN)');
    assert.equal(r, '^(?<MTNumber>.{3})\n(?<Date>.{6})(\n)?((?<SessionNumber>.{4})(?<ISN>.{6}))?$');
  });

  // narrative
  it('charset z', () => {
    const r = factory.createRegexp('8000z', '(Narrative)');
    assert.equal(r, '^(?<Narrative>[\\s\\S]{1,8000})$');
  });
});

describe('FieldNamesParser', () => {
  it('parses empty string', () => {
    const result = ns.FieldNamesParser.parseFieldNames('');
    assert.deepEqual(result, []);
  });
  it('parses one field', () => {
    const result = ns.FieldNamesParser.parseFieldNames('(field)');
    assert.deepEqual(result, ['field']);
  });
  it('parses multiple fields', () => {
    const result = ns.FieldNamesParser.parseFieldNames('(field1)(field2)(field 3 with space)');
    assert.deepEqual(result, ['field1', 'field2', 'field_3_with_space']);
  });
  it('parses multiline fields', () => {
    const result = ns.FieldNamesParser.parseFieldNames('(field1)$(field2)(field3)');
    assert.deepEqual(result, ['field1', 'field2', 'field3']);
  });
});

describe('FieldContentParser', () => {
  const factory = new FieldRegexpFactory();
  it('parses one field', () => {
    const r = factory.createRegexp('6!n', '(Date)');
    const fieldParser = new ns.FieldContentParser(r, new ns.FieldNames('(Date)'));
    const result = fieldParser.parse('123456');
    assert.deepEqual(result, { Date: '123456' });
  });
  it('parses complex field with colon', () => {
    const r = factory.createRegexp(':4!c//8!n6!n[,3n][/[N]2!n[2!n]]', '(Qualifier)(Date)(Time)(Decimals)(UTC Sign)(UTC Indicator)');
    const fieldParser = new ns.FieldContentParser(r, new ns.FieldNames('(Qualifier)(Date)(Time)(Decimals)(UTC Sign)(UTC Indicator)'));
    const result = fieldParser.parse(':QUAL//20140418010323,555/N9912');
    assert.deepEqual(result, {
      Qualifier: 'QUAL', Date: '20140418', Time: '010323', Decimals: '555', 'UTC Sign': 'N', 'UTC Indicator': '9912',
    });
  });
  it('parses complex field without colon', () => {
    const r = factory.createRegexp(':4!c//8!n6!n[,3n][/[N]2!n[2!n]]', '(Qualifier)(Date)(Time)(Decimals)(UTC Sign)(UTC Indicator)');
    const fieldParser = new ns.FieldContentParser(r, new ns.FieldNames('(Qualifier)(Date)(Time)(Decimals)(UTC Sign)(UTC Indicator)'));
    const result = fieldParser.parse('QUAL//20140418010323,555/N9912');
    assert.deepEqual(result, {
      Qualifier: 'QUAL', Date: '20140418', Time: '010323', Decimals: '555', 'UTC Sign': 'N', 'UTC Indicator': '9912',
    });
  });
});

describe('FieldParser', () => {
  let parser;
  before(() => {
    parser = new ns.FieldParser(patterns);
  });

  it('unnamed field', () => {
    const result = parser.parse('12', 'ABC');
    assert.deepEqual(result, { Value: 'ABC' });
  });
  it('named field', () => {
    const result = parser.parse('19', '123456789');
    assert.deepEqual(result, { Amount: '123456789' });
  });
  it('optional part present', () => {
    const result = parser.parse('28', '1234/56');
    assert.deepEqual(result, { 'Page Number': '1234', Indicator: '56' });
  });
  it('optional part missing', () => {
    const result = parser.parse('28', '1234');
    assert.deepEqual(result, { 'Page Number': '1234' });
  });
  it('multiple fields with separator', () => {
    const result = parser.parse('92B', 'ABCD//CZK/USD/,0123456789');
    assert.deepEqual(result, {
      Qualifier: 'ABCD', 'First Currency Code': 'CZK', 'Second Currency Code': 'USD', Rate: ',0123456789',
    });
  });
  it('leading colon', () => {
    const result = parser.parse('92B', ':ABCD//CZK/USD/,0123456789');
    assert.deepEqual(result, {
      Qualifier: 'ABCD', 'First Currency Code': 'CZK', 'Second Currency Code': 'USD', Rate: ',0123456789',
    });
  });
  it('merged fields with optional present', () => {
    const result = parser.parse('95P', ':MERE//CRESCHZZEEO');
    assert.deepEqual(result, { Qualifier: 'MERE', 'Identifier Code': 'CRESCHZZEEO' });
  });
  it('merged fields with optional missing', () => {
    const result = parser.parse('95P', ':MERE//CRESCHZZ');
    assert.deepEqual(result, { Qualifier: 'MERE', 'Identifier Code': 'CRESCHZZ' });
  });
  it('sign missing', () => {
    const result = parser.parse('19A', 'ABCD//CZK123,456');
    assert.deepEqual(result, { Qualifier: 'ABCD', 'Currency Code': 'CZK', Amount: '123,456' });
  });
  it('sign present', () => {
    const result = parser.parse('19A', 'ABCD//NCZK123,456');
    assert.deepEqual(result, {
      Qualifier: 'ABCD', Sign: 'N', 'Currency Code': 'CZK', Amount: '123,456',
    });
  });

  it('handling of 98E - mandatory only', () => {
    const result = parser.parse('98E', 'ABCD//20140427133200');
    assert.deepEqual(result, { Qualifier: 'ABCD', Date: '20140427', Time: '133200' });
  });
  it('handling of 98E - with decimals', () => {
    const result = parser.parse('98E', 'ABCD//20140427133200,123');
    assert.deepEqual(result, {
      Qualifier: 'ABCD', Date: '20140427', Time: '133200', Decimals: '123',
    });
  });
  it('handling of 98E - with sign', () => {
    const result = parser.parse('98E', 'ABCD//20140427133200/N0102');
    assert.deepEqual(result, {
      Qualifier: 'ABCD', Date: '20140427', Time: '133200', 'UTC Sign': 'N', 'UTC Indicator': '0102',
    });
  });

  it('narrative single line', () => {
    const narrative = '++ ADDITIONAL INFORMATION ++SHS DEL';
    const result = parser.parse('70G', `ADTX//${narrative}`);
    assert.deepEqual(result, { Qualifier: 'ADTX', Narrative: narrative });
  });
  it('narrative multiline', () => {
    const narrative = '++ ADDITIONAL INFORMATION ++SHS DEL\nTO YOU UPON RECEIPT PLUS\nHKD80.64';
    const result = parser.parse('70G', `ADTX//${narrative}`);
    assert.deepEqual(result, { Qualifier: 'ADTX', Narrative: narrative });
  });
  it('narrative charset z', () => {
    const narrative = "+------------- REPURCHASE OFFER / -------------+\n+------------ CONSENT SOLICITATION ------------+\n.\nCONTINUATION OF SWIFT MT564/568 SENT WITH CORP.\nREF. 294166.\n.\nPROCEEDS:\n.\n1/(A) TOTAL CONSIDERATION:\nHOLDERS WHO VALIDLY TENDER THEIR NOTES BEFORE\nTHE EARLY TENDER DEADLINE AND WHOSE NOTES ARE\nACCEPTED FOR PURCHASE WILL RECEIVE USD 1'170.87\nFOR EACH USD 1'000 PRINCIPAL AMOUNT.\n(THE TOTAL CONSIDERATION INCLUDES A CONSENT\nPAYMENT OF USD 30.00 PER USD 1'000 PRINCIPAL\nAMOUNT)\n.\n1/(B) OFFER CONSIDERATION:\nHOLDERS WHO VALIDLY TENDER THEIR NOTES AFTER THE\nEARLY TENDER DEADLINE AND WHOSE NOTES ARE\nACCEPTED FOR PURCHASE WILL RECEIVE USD 1'140.87\nFOR EACH USD 1'000 PRINCIPAL AMOUNT.\n.\n2/ IN ADDITION, AN AMOUNT IN CASH FOR ACCRUED\nAND UNPAID INTEREST WILL BE PAID, WHICH WILL BE\nHANDLED BY OUR INCOME DEPARTMENT.\n.\nTHE CONSENT PAYMENT IS N-O-T IRS REPORTABLE WITH\nINCOME CODE 50.\n.\nPOSSIBLE EFFECTS ON UNTENDERED NOTES:\nAS SOON AS REASONABLY PRACTICABLE FOLLOWING THE\nFINANCING, THE COMPANY CURRENTLY INTENDS, BUT IS\nNOT OBLIGATED, TO CALL FOR REDEMPTION ALL OF THE\nNOTES THAT REMAIN OUTSTANDING FOLLOWING THE\nCONSUMMATION OF THE FINANCING IN ACCORDANCE WITH\nTHE PROVISIONS OF THE INDENTURE, AND AT THAT\nTIME TO SATISFY AND DISCHARGE THE INDENTURE IN\nACCORDANCE WITH ITS TERMS. PLEASE FIND FURTHER\nINFORMATION TO UNTENDERED NOTES ON PAGES 6, 10\nAND 20-21 IN THE 'PROSPECTUS'.\n.\nCONDITIONS OF THE OFFER:\nTHE OFFER IS NOT CONDITIONED UPON ANY MINIMUM\nAMOUNT OF NOTES BEING TENDERED OR ANY OF THE\nPROPOSED AMENDMENTS BECOMING OPERATIVE. THE\nOFFER IS HOWEVER SUBJECT TO THE SATISFACITON OF\nTHE FINANCING CONDITION AND THE GENERAL\nCONDITIONS.\n.\nADOPTION OF THE PROPOSED AMENDMENTS ARE SUBJECT\nTO COMPANY'S RECEIPT OF THE RELEVANT REQUISITE\nCONSENTS, SATISFACTION OF THE FINANCING\nCONDITION AND CONSUMMATION OF THE OFFER.\n.\nPLEASE FIND FULL DESCRIPTION OF THE OFFER\nCONDITIONS ON PAGES III AND 11-13 IN THE\n'PROSPECTUS'.\n.\nTIMETABLE:\nWITHDRAWAL DEADLINE: PLEASE FULLY REFER TO PAGE\nIV IN THE 'PROSPECTUS'\n.\nRESTRICTIONS: NONE\nINVESTORS MUST VERIFY THAT THEY ARE NOT ACTING\nAGAINST THEIR COUNTRY'S REGULATIONS.\n.\nWITH YOUR INSTRUCTION YOU CONFIRM YOUR\nELIGIBILITY TO PARTICIPATE IN THE OFFER.\n.\nTHE 'PROSPECTUS' IS AVAILABLE IN CAES OR AT SIX\nSIS UPON REQUEST.\n.\n+++++++++ EARLY RESULTS AND SETTLEMENT +++++++++\n.\nAS OF THE EARLY TENDER DEADLINE USD 598'620'000\nAGGREGATE PRINCIPAL AMOUNT, OR APPROXIMATELY\n99.8 PCT OF THE NOTES HAVE BEEN VALIDLY TENDERED\nAND THE RELATED CONSENTS HAVE BEEN VALIDLY\nDELIVERED.\n.\nWITH THE RECEIPT OF THE REQUISITE CONSENTS, THE\nCOMPANY HAS EXECUTED A SUPPLEMENTAL INDENTURE\nGOVERNING THE NOTES, WHICH WILL AMEND THE\nINDENTURE UNDER WHICH THE NOTES WERE ISSUED TO\nELIMINATE SUBSTANTIALLY ALL OF THE RESTRICTIVE\nCOVENANTS AND EVENTS OF DEFAULT AND RELATED\nPROVISIONS IN THE INDENTURE. THE AMENDMENTS TO\nTHE INDENTURE WILL BECOME OPERATIVE UPON PAYMENT\nFOR NOTES VALIDLY TENDERED PRIOR TO THE EARLY\nTENDER DEADLINE MADE BY THE COMPANY.\n.\nHOLDERS WHO PARTICIPATED IN THE OFFER AND WHOSE\nNOTES HAVE BEEN ACCEPTED WILL BE CREDITED TODAY,\nWITH VALUE DATE 08.02.2013, WITH THE FOLLOWING\nCASH AMOUNT (FOR EACH USD 1'000 P.A.):\n.\nPURCHASE PRICE: USD 1'140.87\nCONSENT PAYMENT: USD 30.00\nACCRUED INTEREST: USD 23.631944\n(RATE: 10.25 PCT / DAYS: 83/360)\n.\nTHE 'EARLY RESULTS ANNOUNCEMENT' IS AVAILABLE IN\nCAES OR AT SIX SIS UPON REQUEST.\n.\nSTATUS: COMPLETE\n.\nFOR ANY QUERIES PLEASE CONTACT:\nCABO.GROUP(AT)ISIS.SISCLEAR.COM";
    const result = parser.parse('70F', `ADTX//${narrative}`);
    assert.deepEqual(result, { Qualifier: 'ADTX', Narrative: narrative });
  });

  it('identification of security with ISIN and description', () => {
    const result = parser.parse('35B', 'ISIN US8175651046\n/CH/969683\nSERVICE CORP INTL SHS');
    assert.deepEqual(result, { 'Identification of Security': 'US8175651046', 'Description of Security': '/CH/969683\nSERVICE CORP INTL SHS' });
  });
  it('identification of security without ISIN', () => {
    const content = '/CH/969683\nSERVICE CORP INTL SHS';
    const result = parser.parse('35B', content);
    assert.deepEqual(result, { 'Description of Security': content });
  });
  it('identification of security with ISIN only', () => {
    const result = parser.parse('35B', 'ISIN US8175651046');
    assert.deepEqual(result, { 'Identification of Security': 'US8175651046' });
  });
  it('multiline pattern - first line present', () => {
    const result = parser.parse('53D', '/X/123456\nname\naddres\naddress2');
    assert.deepEqual(result, { 'Party Identifier': '/X/123456', 'Name and Address': 'name\naddres\naddress2' });
  });
  it('multiline pattern - first line missing', () => {
    const result = parser.parse('53D', 'name\naddres\naddress2');
    assert.deepEqual(result, { 'Name and Address': 'name\naddres\naddress2', 'Party Identifier': '' }); // the fully optional party matches an empty string
  });


  it('handling of 77E not supported', () => {
    assert.throws(() => {
      parser.parse('77E', 'ABCD//20140427133200');
    });
  });
});
