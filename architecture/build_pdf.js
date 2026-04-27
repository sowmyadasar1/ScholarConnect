const fs = require('fs');
const { mdToPdf } = require('md-to-pdf');
const path = require('path');

async function build() {
  try {
    const files = ['section_a.md', 'section_b.md', 'section_c.md', 'section_d.md', 'section_e_f.md', 'section_g.md'];
    let content = '';
    
    for (const file of files) {
      content += fs.readFileSync(path.join(__dirname, file), 'utf8') + '\n\n';
    }

    fs.writeFileSync(path.join(__dirname, 'architecture.md'), content);
    console.log('architecture.md generated.');

    console.log('Starting PDF generation...');
    const pdf = await mdToPdf(
      { path: path.join(__dirname, 'architecture.md') },
      { 
        dest: path.join(__dirname, 'ScholarConnect_Architecture.pdf'),
        css_file: path.join(__dirname, 'styles.css'),
        pdf_options: {
          format: 'A4',
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
          printBackground: true
        }
      }
    );

    if (pdf) {
      console.log('PDF generated successfully at ScholarConnect_Architecture.pdf');
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}

build();
