import { describe, it, expect } from 'vitest';
import { takhrijLine } from './takhrij';

const url = 'https://dorar.net/hadith/sharh/1';

describe('takhrijLine', () => {
  it('cites al-Bukhari and Muslim by book and number, with no ruling', () => {
    expect(
      takhrijLine({ grader: 'البخاري', source: 'صحيح البخاري ٦٣٠٦', ruling: 'صحيح', url })
    ).toBe('صحيح البخاري (٦٣٠٦)');
    expect(takhrijLine({ grader: 'مسلم', source: 'صحيح مسلم ٢٧٢٣', ruling: 'صحيح', url })).toBe(
      'صحيح مسلم (٢٧٢٣)'
    );
  });

  it('says that al-Albani graded it صحيح', () => {
    expect(
      takhrijLine({ grader: 'الألباني', source: 'صحيح الترغيب ٦٦٢', ruling: 'صحيح', url })
    ).toBe('صحّحه الألباني في صحيح الترغيب (٦٦٢)');
  });

  it('says that al-Albani graded it حسن', () => {
    expect(
      takhrijLine({ grader: 'الألباني', source: 'صحيح أبي داود ٥٠٨٢', ruling: 'حسن', url })
    ).toBe('حسّنه الألباني في صحيح أبي داود (٥٠٨٢)');
  });

  it('quotes the phrase that al-Albani leaves out of his ruling', () => {
    expect(
      takhrijLine({
        grader: 'الألباني',
        source: 'صحيح أبي داود ٥٠٤٥',
        ruling: 'صحيح دون قوله: ثلاث مرار',
        url,
      })
    ).toBe('صحّحه الألباني في صحيح أبي داود (٥٠٤٥) دون قوله «ثلاث مرار»');
    expect(
      takhrijLine({
        grader: 'الألباني',
        source: 'صحيح الترمذي ٣٤٣٣',
        ruling: 'حسن دون زيادة: وما تأخر',
        url,
      })
    ).toBe('حسّنه الألباني في صحيح الترمذي (٣٤٣٣) دون زيادة «وما تأخر»');
  });

  it('quotes any other ruling as al-Albani wrote it', () => {
    expect(
      takhrijLine({
        grader: 'الألباني',
        source: 'السلسلة الصحيحة ٢٥٦٣',
        ruling: 'إسناده حسن على شرط مسلم',
        url,
      })
    ).toBe('قال الألباني في السلسلة الصحيحة (٢٥٦٣): إسناده حسن على شرط مسلم');
  });

  it('keeps the name of a ضعيف book away from the verb that accepts the hadith', () => {
    expect(
      takhrijLine({
        grader: 'الألباني',
        source: 'ضعيف الترمذي ٣٤٦٨',
        ruling: 'صحيح دون قوله: يحيي ويميت',
        url,
      })
    ).toBe('صحّح الألباني الحديث دون قوله «يحيي ويميت» (ضعيف الترمذي ٣٤٦٨)');
  });

  it('says that al-Albani graded it ضعيف', () => {
    expect(
      takhrijLine({ grader: 'الألباني', source: 'ضعيف أبي داود ٥٠٧٨', ruling: 'ضعيف', url })
    ).toBe('ضعّفه الألباني في ضعيف أبي داود (٥٠٧٨)');
  });

  it('keeps a volume and page together in the brackets', () => {
    expect(
      takhrijLine({
        grader: 'الألباني',
        source: 'إرواء الغليل ١/٢٦٠',
        ruling: 'زيادة: إنك لا تخلف الميعاد شاذة',
        url,
      })
    ).toBe('قال الألباني في إرواء الغليل (١/٢٦٠): زيادة: إنك لا تخلف الميعاد شاذة');
  });

  it('puts no middle dot next to a number', () => {
    expect(
      takhrijLine({ grader: 'البخاري', source: 'صحيح البخاري ٦٣٠٦', ruling: 'صحيح', url })
    ).not.toContain('·');
  });
});
