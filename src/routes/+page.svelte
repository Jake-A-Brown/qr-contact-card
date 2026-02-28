<script>
	import QRCode from 'qrcode';

	// Form fields
	let firstName = '';
	let lastName = '';
	let title = '';
	let phone = '';
	let email = '';
	let organization = ''; // optional company/org name

	// Array of URLs (social profiles, website, etc.)
	let urls = [''];

	// QR code data URL
	let qrSrc = '';

	// Error message if something goes wrong
	let error = '';

	function debounce(fn, delayMs = 500) {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => fn(...args), delayMs);
		};
	}

	const debouncedGenerate = debounce(generateQRCode, 500);

	// Reactively trigger generation whenever relevant fields change
	$: if (
		firstName ||
		lastName ||
		title ||
		phone ||
		email ||
		organization ||
		urls.some((u) => u.trim())
	) {
		debouncedGenerate();
	}

	// Clean phone number: keep only digits and optional leading +
	function cleanPhone(input) {
		return input.replace(/[^\d+]/g, '');
	}

	// Build a vCard 3.0 string that works reliably with most mobile scanners
	function buildVCard() {
		const cleanedPhone = cleanPhone(phone);

		// Build name parts safely
		const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Contact';

		let lines = [
			'BEGIN:VCARD',
			'VERSION:3.0',
			// Structured name: Last;First;Middle;Prefix;Suffix
			`N:${lastName || ''};${firstName || ''};;;`,
			// Human-readable full name (required by many parsers)
			`FN:${fullName}`,
			// Optional organization/company
			organization.trim() ? `ORG:${organization.trim()}` : '',
			// Job title
			title.trim() ? `TITLE:${title.trim()}` : '',
			// Phone – prefer CELL type
			cleanedPhone ? `TEL;TYPE=CELL:${cleanedPhone}` : '',
			// Email – mark as work/internet
			email.trim() ? `EMAIL;TYPE=INTERNET,WORK:${email.trim()}` : '',
			// All non-empty URLs
			...urls
				.map((u) => u.trim())
				.filter(Boolean)
				.map((u) => `URL:${u}`),
			'END:VCARD'
		];

		// Remove any empty lines (in case optional fields are blank)
		return lines.filter((line) => line !== '').join('\n');
	}

	// Generate the QR code from the current vCard data
	async function generateQRCode() {
		error = ''; // clear previous errors
		const vCard = buildVCard();

		// Skip if vCard is basically empty
		if (vCard === 'BEGIN:VCARD\nVERSION:3.0\nFN:Contact\nEND:VCARD') {
			qrSrc = '';
			return;
		}

		try {
			qrSrc = await QRCode.toDataURL(vCard, {
				errorCorrectionLevel: 'H', // High error correction – good for business cards/print
				margin: 2,
				scale: 8, // Reasonable size/sharpness balance
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		} catch (err) {
			console.error('QR generation failed:', err);
			error = 'Failed to generate QR code. Try shorter text or check input.';
			qrSrc = '';
		}
	}

	// Add a new empty URL field
	function addUrl() {
		urls = [...urls, ''];
	}

	// Remove a specific URL field
	function removeUrl(index) {
		urls = urls.filter((_, i) => i !== index);
	}
</script>

<main
	style="display: flex; flex-direction: column; align-items: center; min-height: 100vh; background: #f8fafc; padding: 2rem; font-family: system-ui, sans-serif;"
>
	<h1 style="margin: 0 0 1.5rem; font-size: 2.2rem; color: #0f172a;">Create QR Contact Card</h1>

	<form
		on:submit|preventDefault={generateQRCode}
		style="display: grid; gap: 1rem; max-width: 500px; width: 100%;"
	>
		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
			<label>
				First Name
				<input type="text" bind:value={firstName} placeholder="John" />
			</label>

			<label>
				Last Name
				<input type="text" bind:value={lastName} placeholder="Doe" />
			</label>
		</div>

		<label>
			Job Title
			<input type="text" bind:value={title} placeholder="Software Engineer" />
		</label>

		<label>
			Organization / Company
			<input type="text" bind:value={organization} placeholder="Awesome Corp" />
		</label>

		<label>
			Phone Number
			<input
				type="tel"
				bind:value={phone}
				placeholder="+1 (904) 555-1234"
				on:input={() => (phone = cleanPhone(phone))}
			/>
		</label>

		<label>
			Email
			<input type="email" bind:value={email} placeholder="john@example.com" />
		</label>

		<fieldset style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem;">
			<legend style="padding: 0 0.5rem; color: #475569;">Links (website, LinkedIn, etc.)</legend>

			{#each urls as url, index}
				<div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
					<input
						type="url"
						bind:value={urls[index]}
						placeholder="https://linkedin.com/in/yourname"
						style="flex: 1;"
					/>
					{#if urls.length > 1}
						<button
							type="button"
							on:click={() => removeUrl(index)}
							aria-label="Remove URL"
							style="background: none; border: none; color: #ef4444; font-size: 1.4rem; cursor: pointer; line-height: 1;"
						>
							×
						</button>
					{/if}
				</div>
			{/each}

			<button
				type="button"
				on:click={addUrl}
				style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer;"
			>
				+ Add Another Link
			</button>
		</fieldset>

		<button
			type="submit"
			style="padding: 0.9rem; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 1.1rem; cursor: pointer; margin-top: 1rem;"
		>
			Generate QR Code
		</button>
	</form>

	{#if error}
		<p style="color: #ef4444; margin-top: 1.5rem; text-align: center;">{error}</p>
	{/if}

	{#if qrSrc}
		<div style="margin-top: 2.5rem; text-align: center;">
			<img
				src={qrSrc}
				alt="QR code for contact information: {firstName} {lastName}"
				style="width: 280px; height: 280px; background: white; padding: 1rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);"
			/>

			<div style="margin-top: 1.5rem;">
				<a
					href={qrSrc}
					download="contact-qr-{firstName || 'contact'}.png"
					style="display: inline-block; padding: 0.6rem 1.4rem; background: #1e40af; color: white; border-radius: 8px; text-decoration: none; font-weight: 500;"
				>
					Download QR Code
				</a>
			</div>
		</div>
	{:else if firstName || lastName || phone || email}
		<p style="color: #64748b; margin-top: 2rem;">Generating QR code...</p>
	{/if}

	<p
		style="margin-top: 3rem; color: #64748b; font-size: 0.95rem; text-align: center; max-width: 500px;"
	>
		Fill in your details above. The QR code will update automatically as you type.<br />
		Scan it with any phone camera to quickly save the contact.
	</p>
</main>

<style>
	:global(body) {
		margin: 0;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-weight: 500;
		color: #1e293b;
	}

	input {
		padding: 0.7rem;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
	}
</style>
