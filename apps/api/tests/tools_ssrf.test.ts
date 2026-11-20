import { ToolService } from '../src/services/tool.service';
import { isSsrfSafeUrl } from '../src/utils/security';

describe('Tool Registry & SSRF Safeguards', () => {
  it('should safely calculate mathematical expressions without code injection', async () => {
    const res = await ToolService.executeTool(
      'calculator',
      { expression: '(50 * 4) + (100 / 2)' },
      { organizationId: 'dummy_org' }
    );

    expect(res.success).toBe(true);
    expect(res.result.value).toBe(250);
  });

  it('should reject mathematical expressions with arbitrary syntax or injections', async () => {
    const res = await ToolService.executeTool(
      'calculator',
      { expression: 'process.exit(1)' },
      { organizationId: 'dummy_org' }
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid characters');
  });

  it('should block SSRF attacks to localhost and loopback addresses', () => {
    const localhost = isSsrfSafeUrl('http://localhost:8080/admin');
    expect(localhost.safe).toBe(false);

    const loopback = isSsrfSafeUrl('http://127.0.0.1:5000/keys');
    expect(loopback.safe).toBe(false);
  });

  it('should block SSRF attacks targeting cloud metadata endpoints (169.254.169.254)', () => {
    const metadata = isSsrfSafeUrl('http://169.254.169.254/latest/meta-data/');
    expect(metadata.safe).toBe(false);
  });

  it('should block SSRF attacks targeting private RFC 1918 subnets', () => {
    expect(isSsrfSafeUrl('http://10.0.0.1/internal').safe).toBe(false);
    expect(isSsrfSafeUrl('http://192.168.1.1/router').safe).toBe(false);
    expect(isSsrfSafeUrl('http://172.16.0.5/api').safe).toBe(false);
  });

  it('should allow public routable HTTPS URLs', () => {
    const valid = isSsrfSafeUrl('https://api.github.com/zen');
    expect(valid.safe).toBe(true);
  });
});
