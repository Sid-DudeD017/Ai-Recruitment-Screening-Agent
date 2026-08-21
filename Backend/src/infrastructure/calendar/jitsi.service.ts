import crypto from 'crypto';

export const jitsiService = {
  generateMeetingLink: (candidateName: string, role: string) => {
    // Clean names to be URL safe
    const safeName = candidateName.replace(/[^a-zA-Z0-9]/g, '');
    const safeRole = role.replace(/[^a-zA-Z0-9]/g, '');
    
    // Add a random 8-character string for security
    const secureHash = crypto.randomBytes(4).toString('hex');
    
    // Output: https://meet.jit.si/FrontendDeveloper-JohnDoe-a1b2c3d4
    return `https://meet.jit.si/${safeRole}-${safeName}-${secureHash}`;
  }
}
