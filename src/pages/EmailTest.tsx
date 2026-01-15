import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

/** * Email Test Page
 * Simple UI to test email configuration
 */
export function EmailTest() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult('');
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionResult('✅ Email server connection successful!');
      } else {
        setConnectionResult(`❌ Connection failed: ${data.error}`);
      }
    } catch (error) {
      setConnectionResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSendTest = async () => {
    if (!recipientEmail) {
      setTestResult('❌ Please enter an email address');
      return;
    }

    setIsSendingTest(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult(`✅ Test email sent successfully to ${recipientEmail}`);
      } else {
        setTestResult(`❌ Failed to send: ${data.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Email Configuration Test</h1>

      <div className="space-y-6">
        {/* Test Connection */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. Test SMTP Connection</h2>
            <p className="text-gray-600 mb-4">
              Verify that your SMTP server configuration is correct
            </p>
            
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="w-full"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {connectionResult && (
              <div className={`mt-4 p-3 rounded ${
                connectionResult.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {connectionResult}
              </div>
            )}
          </div>
        </Card>

        {/* Send Test Email */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Send Test Email</h2>
            <p className="text-gray-600 mb-4">
              Send a test email to verify end-to-end functionality
            </p>
            
            <div className="space-y-4">
              <Input
                label="Recipient Email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="your-email@example.com"
              />
              
              <Button
                onClick={handleSendTest}
                disabled={isSendingTest || !recipientEmail}
                className="w-full"
              >
                {isSendingTest ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
            
            {testResult && (
              <div className={`mt-4 p-3 rounded ${
                testResult.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </Card>

        {/* Configuration Info */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <div className="bg-gray-50 p-4 rounded text-sm font-mono">
              <div>SMTP_HOST: {process.env.SMTP_HOST || 'Not set'}</div>
              <div>SMTP_PORT: {process.env.SMTP_PORT || 'Not set'}</div>
              <div>SMTP_USER: {process.env.SMTP_USER || 'Not set'}</div>
              <div>SMTP_PASS: {process.env.SMTP_PASS ? '••••••••' : 'Not set'}</div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>📝 To configure email:</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Copy .env.example to .env</li>
                <li>Set your SMTP credentials</li>
                <li>Restart the server</li>
                <li>Test the connection</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
