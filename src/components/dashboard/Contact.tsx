import styles from './Contact.module.css';

export default function Contact() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>Legal Information</h2>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Legal Notice</h3>
                    <h4 className={styles.subTitle}>1. Identification Details</h4>
                    <p className={styles.text}>
                        In compliance with Article 10 of Law 34/2002, of July 11, on Information Society Services and Electronic Commerce, the following are the identifying details of the company:
                    </p>
                    <ul className={styles.infoList}>
                        <li><strong>Owner:</strong> Ranku.es</li>
                        <li><strong>Email:</strong> <a href="mailto:e2517dev@gmail.com" className={styles.link}>e2517dev@gmail.com</a></li>
                        <li><strong>GitHub:</strong> Software Engineer</li>
                    </ul>
                    <p className={styles.text}>
                        My greatest satisfaction is seeing how software solves real problems or improves the lives of the people or businesses that use it. "My best-kept SEO secret: It's this tool! Discover the keywords your competitors are ignoring. Start spying on your competition right now—but fix your own house first: analyze your SEO status 😜"
                    </p>
                    <p className={styles.text}>
                        If you spot a bug, or if you think this thing could be 1% more spectacular, drop me a line. I’ll take care of it. My guarantee is simple: if I don’t fix it, I’ll buy you a coffee ☕
                    </p>
                    <p className={styles.text}>
                        Use of the website implies full and unconditional acceptance of all provisions included in this Legal Notice.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Terms of Service</h3>
                    <h4 className={styles.subTitle}>Service Subscription</h4>
                    <p className={styles.text}>
                        The services offered through this platform consist of subscriptions to a tool for analyzing and visualizing organic search results (SEO). Users may subscribe to one of the available plans (Básico, Pro, Ultra) through an automated payment system.
                    </p>
                    <h4 className={styles.subTitle}>Subscription Process</h4>
                    <p className={styles.text}>
                        The subscription process is completed online. The user must register or log in, select a plan, and complete payment through an external payment provider (Stripe). The subscription becomes effective once payment is confirmed.
                    </p>
                    <h4 className={styles.subTitle}>Service Cancellation</h4>
                    <p className={styles.text}>
                        Users may cancel their subscription at any time from their profile. Cancellation will take effect at the end of the current billing period. No refunds will be issued for already billed periods.
                    </p>
                    <h4 className={styles.subTitle}>Platform Access</h4>
                    <p className={styles.text}>
                        Once a plan is subscribed, the user will have access to the functionalities associated with that plan, subject to the limitations described in the plan details. Access is granted through personal and non-transferable credentials.
                    </p>
                    <h4 className={styles.subTitle}>Modification of Terms</h4>
                    <p className={styles.text}>
                        The platform owner reserves the right to modify these general terms and/or service features at any time. Such changes will be communicated to users with reasonable advance notice.
                    </p>
                    <h4 className={styles.subTitle}>Service Availability</h4>
                    <p className={styles.text}>
                        Every effort will be made to keep the service available, but uninterrupted availability is not guaranteed. The owner is not liable for any damages arising from service unavailability.
                    </p>
                    <h4 className={styles.subTitle}>Limitation of Liability</h4>
                    <p className={styles.text}>
                        Use of the tool is solely at the user’s own risk. The owner is not responsible for decisions made by the user based on data provided by the platform.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Data Protection</h3>
                    <p className={styles.text}>
                        Personal data processing is carried out in accordance with applicable data protection regulations. Please consult our Privacy Policy for more information.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Intellectual Property</h3>
                    <p className={styles.text}>
                        All content and elements of the platform are the property of the owner or third parties and are protected by intellectual property laws. Unauthorized reproduction, distribution, or use is prohibited.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Dispute Resolution</h3>
                    <p className={styles.text}>
                        In the event of a dispute, an amicable resolution will be attempted. For consumer users, the European Commission provides an online dispute resolution platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className={styles.link}>https://ec.europa.eu/consumers/odr</a>
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Acceptance of Terms</h3>
                    <p className={styles.text}>
                        These general terms may be saved and reproduced at any time by the user making a purchase using their web browser options, and must be accepted before proceeding with payment.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>User Account and Error Correction</h3>
                    <p className={styles.text}>
                        To make online purchases on this platform, you must register by creating a “User Account.” You may register or log in at any time by clicking the corresponding link.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Payment Methods</h3>
                    <p className={styles.text}>
                        Payments are accepted via credit or debit card through the Stripe payment system. Payments are processed securely, and no card data is stored on our servers. You can pay with cards from the 4B, Red 6000, and Servired networks. If you have any questions, contact us and we’ll be happy to assist you.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Prices, Taxes, Fees, and Duties</h3>
                    <p className={styles.text}>
                        Prices are expressed in Euros and include VAT, and are valid except in the case of typographical error. Should a manifest pricing error appear on the service page, the price stated in the informational email we send you upon detecting the error will prevail.
                    </p>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Contact</h3>
                    <p className={styles.text}>
                        If you have any questions or need support, you can contact us through the following channels:
                    </p>
                    <ul className={styles.infoList}>
                        <li><strong>Email:</strong> <a href="mailto:e2517dev@gmail.com" className={styles.link}>e2517dev@gmail.com</a></li>
                    </ul>
                </section>
            </div>
        </div>
    );
}